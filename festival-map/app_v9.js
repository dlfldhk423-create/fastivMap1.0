import { getAnonymousKey } from '@apps-in-toss/web-framework';

// --- Configuration (Environment Variables) ---
const API_KEY = import.meta.env.VITE_TOUR_API_KEY;
const TOUR_BASE_URL = import.meta.env.VITE_TOUR_BASE_URL;
const WEATHER_BASE_URL = import.meta.env.VITE_WEATHER_BASE_URL;

// --- Global States ---
let map = null;
let userKey = null;
let favoriteIds = [];

// --- DOM Elements ---
const areaSelect = document.getElementById('area-select');
const currentAreaLabel = document.getElementById('current-area-label');
const dateInput = document.getElementById('date-input');
const currentDateLabel = document.getElementById('current-date-label');
const todayBtn = document.getElementById('today-btn');
const searchBtn = document.getElementById('search-btn');
const nearbyBtn = document.getElementById('nearby-btn');
const festivalList = document.getElementById('festival-list');
const resultCount = document.getElementById('result-count');
const loader = document.getElementById('loader');
const recommendationList = document.getElementById('recommendation-list');
const detailOverlay = document.getElementById('detail-overlay');
const festivalDetail = document.getElementById('festival-detail');
const detailContentArea = document.getElementById('detail-content-area');
const closeDetail = document.getElementById('close-detail');
const appHeader = document.getElementById('app-header');

// --- Initialization ---

/**
 * Main app initializer
 */
async function initializeApp() {
    initEventListeners();
    setTodayDate();
    
    // Header Blur/Shadow effect on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            appHeader.classList.add('scrolled');
        } else {
            appHeader.classList.remove('scrolled');
        }
    });

    try {
        const result = await getAnonymousKey();
        userKey = result?.anonymousKey;
        if (userKey) {
            loadFavorites();
        }
    } catch (error) {
        console.error('Failed to get anonymous key:', error);
    }
    
    // Always try to load recommendations
    initializeRecommendations();
}

/**
 * Initialize Event Listeners
 */
function initEventListeners() {
    if (searchBtn) searchBtn.onclick = () => searchFestivals(false);
    if (nearbyBtn) nearbyBtn.onclick = () => searchFestivals(true);
    if (todayBtn) todayBtn.onclick = setTodayDate;
    if (closeDetail) closeDetail.onclick = hideBottomSheet;
    if (detailOverlay) detailOverlay.onclick = hideBottomSheet;
    
    if (areaSelect) {
        areaSelect.onchange = (e) => {
            const selectedText = e.target.options[e.target.selectedIndex].text;
            if (currentAreaLabel) currentAreaLabel.innerText = selectedText;
        };
    }

    if (dateInput) {
        dateInput.onchange = (e) => {
            updateDateLabel(e.target.value);
        };
    }
}

/**
 * Set current date to today
 */
function setTodayDate() {
    if (dateInput) {
        const today = new Date().toLocaleDateString('en-CA');
        dateInput.value = today;
        updateDateLabel(today);
    }
}

/**
 * Update the visible text for the selected date
 */
function updateDateLabel(dateStr) {
    if (!currentDateLabel) return;
    
    const today = new Date().toLocaleDateString('en-CA');
    if (dateStr === today) {
        currentDateLabel.innerText = '오늘';
    } else {
        const date = new Date(dateStr);
        currentDateLabel.innerText = `${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
}

/**
 * Load favorites from local storage
 */
function loadFavorites() {
    const saved = localStorage.getItem(`faves_${userKey}`);
    if (saved) {
        favoriteIds = JSON.parse(saved);
        console.log('Favorites loaded:', favoriteIds);
    }
}

/**
 * Save favorites to local storage
 */
function saveFavorites() {
    if (userKey) {
        localStorage.setItem(`faves_${userKey}`, JSON.stringify(favoriteIds));
    }
}

// --- Dynamic Content & API ---

/**
 * Load popular festival recommendations
 */
async function initializeRecommendations() {
    if (!recommendationList) return;
    
    try {
        const todayStr = new Date().toLocaleDateString('en-CA').replace(/-/g, '');
        // Search for festivals happening around now (nationwide)
        const url = `${TOUR_BASE_URL}/searchFestival2?serviceKey=${API_KEY}&numOfRows=10&pageNo=1&MobileOS=ETC&MobileApp=TossFestival&_type=json&arrange=C&eventStartDate=${todayStr}`;
        
        const response = await fetch(url);
        const data = await response.json();
        const items = data.response?.body?.items?.item;

        if (items && items.length > 0) {
            renderRecommendations(items);
        } else {
            recommendationList.innerHTML = '<p class="msg" style="padding:20px;">현재 진행 중인 인기 축제가 없습니다.</p>';
        }
    } catch (error) {
        console.error('Failed to load recommendations:', error);
        recommendationList.innerHTML = '<p class="msg" style="padding:20px;">추천 축제를 불러오지 못했습니다.</p>';
    }
}

/**
 * Render recommendations list
 */
function renderRecommendations(items) {
    if (!recommendationList) return;
    recommendationList.innerHTML = '';
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'recommend-card';
        card.innerHTML = `
            <div class="image-container">
                <img src="${item.firstimage || 'https://via.placeholder.com/300x400?text=No+Image'}" alt="${item.title}" loading="lazy">
            </div>
            <div class="title">${item.title}</div>
        `;
        card.onclick = () => showDetail(item.contentid);
        recommendationList.appendChild(card);
    });
}

/**
 * Search Festivals
 */
async function searchFestivals(isNearby) {
    if (loader) loader.style.display = 'flex';
    if (festivalList) festivalList.innerHTML = '';
    if (resultCount) resultCount.innerText = '찾는 중...';

    try {
        const searchDate = dateInput.value.replace(/-/g, '');
        const areaCode = areaSelect.value;
        const selectedAreaText = areaSelect.options[areaSelect.selectedIndex].text;

        let url = '';
        if (isNearby) {
            const lat = 37.5665;
            const lng = 126.9780;
            url = `${TOUR_BASE_URL}/locationBasedList2?serviceKey=${API_KEY}&numOfRows=50&pageNo=1&MobileOS=ETC&MobileApp=TossFestival&_type=json&mapX=${lng}&mapY=${lat}&radius=20000&contentTypeId=15&arrange=A`;
        } else {
            // 지역 선택이 있더라도 우선 '전국' 검색 수행 (API의 지역 코드 누락 대응)
            url = `${TOUR_BASE_URL}/searchFestival2?serviceKey=${API_KEY}&numOfRows=200&pageNo=1&MobileOS=ETC&MobileApp=TossFestival&_type=json&arrange=C&eventStartDate=${searchDate}`;
            
            // 만약 특정 지역이 선택되었다면 파라미터형 검색도 시도해볼 수 있지만, 
            // 데이터 무결성을 위해 전체를 가져와 필터링하는 방식이 더 안정적입니다.
        }

        const response = await fetch(url);
        const data = await response.json();
        let items = data.response?.body?.items?.item || [];
        if (!Array.isArray(items)) items = [items];

        // 지역 필터링 (지역이 선택된 경우에만)
        if (!isNearby && areaCode !== "") {
            items = items.filter(item => {
                // 1. 공식 지역 코드가 일치하는지 확인
                if (item.areacode === areaCode) return true;
                
                // 2. 주소 텍스트에 지역명이 포함되어 있는지 확인 (가장 확실함)
                const addr = item.addr1 || "";
                return addr.includes(selectedAreaText) || (selectedAreaText === "경기" && addr.includes("경기도"));
            });
        }

        if (loader) loader.style.display = 'none';

        if (items && items.length > 0) {
            renderFestivalList(items);
            resultCount.innerText = `${items.length}개의 축제 발견`;
        } else {
            festivalList.innerHTML = `
                <div class="empty-state">
                    <span class="icon">🏜️</span>
                    <p class="msg">${selectedAreaText} 지역에<br>선택하신 날짜의 축제가 없습니다.</p>
                </div>
            `;
            resultCount.innerText = '결과 없음';
        }
    } catch (error) {
        console.error('Search failed:', error);
        if (loader) loader.style.display = 'none';
        resultCount.innerText = '오류 발생';
    }
}

/**
 * Render Festival List
 */
function renderFestivalList(items) {
    if (!festivalList) return;
    festivalList.innerHTML = '';

    items.forEach(item => {
        const isFav = favoriteIds.includes(item.contentid);
        const div = document.createElement('div');
        div.className = 'festival-item';
        div.innerHTML = `
            <img src="${item.firstimage2 || 'https://via.placeholder.com/150?text=Logo'}" class="festival-thumb" alt="${item.title}">
            <div class="festival-info">
                <div class="festival-title">${item.title}</div>
                <div class="festival-date">${formatDate(item.eventstartdate)} ~ ${formatDate(item.eventenddate)}</div>
            </div>
            <div class="favorite-icon ${isFav ? 'active' : ''}" data-id="${item.contentid}">
                ${isFav ? '❤️' : '🤍'}
            </div>
        `;
        
        div.onclick = (e) => {
            if (e.target.classList.contains('favorite-icon')) {
                toggleFavorite(item.contentid, e.target);
            } else {
                showDetail(item.contentid);
            }
        };
        festivalList.appendChild(div);
    });
}

function formatDate(str) {
    if (!str || str.length < 8) return str;
    return `${str.substring(4,6)}.${str.substring(6,8)}`;
}

/**
 * Bottom Sheet Management
 */
function showBottomSheet() {
    if (detailOverlay) detailOverlay.classList.add('active');
    if (festivalDetail) festivalDetail.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideBottomSheet() {
    if (detailOverlay) detailOverlay.classList.remove('active');
    if (festivalDetail) festivalDetail.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Show Detailed View
 */
async function showDetail(contentId) {
    showBottomSheet();
    if (detailContentArea) detailContentArea.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';

    try {
        // detailCommon2와 detailIntro2를 병렬로 호출하여 정보 획득
        const commonUrl = `${TOUR_BASE_URL}/detailCommon2?serviceKey=${API_KEY}&MobileOS=ETC&MobileApp=TossFestival&_type=json&contentId=${contentId}&overviewYN=Y&addrinfoYN=Y&defaultYN=Y&firstImageYN=Y`;
        const introUrl = `${TOUR_BASE_URL}/detailIntro2?serviceKey=${API_KEY}&MobileOS=ETC&MobileApp=TossFestival&_type=json&contentId=${contentId}&contentTypeId=15`;
        
        const [commonRes, introRes] = await Promise.all([
            fetch(commonUrl).then(r => r.json()),
            fetch(introUrl).then(r => r.json())
        ]);
        
        let commonItem = commonRes.response?.body?.items?.item;
        if (Array.isArray(commonItem)) commonItem = commonItem[0];

        let introItem = introRes.response?.body?.items?.item;
        if (Array.isArray(introItem)) introItem = introItem[0];

        if (commonItem) {
            renderDetail(commonItem, introItem);
        } else {
            if (detailContentArea) detailContentArea.innerHTML = '<div class="empty-state"><p class="msg">등록된 상세 정보가 없습니다.</p></div>';
        }
    } catch (error) {
        console.error('Failed to load details:', error);
        if (detailContentArea) detailContentArea.innerHTML = '<div class="empty-state"><p class="msg">정보를 불러오지 못했습니다.</p></div>';
    }
}

/**
 * Render Detail View in Bottom Sheet
 */
function renderDetail(item, intro) {
    if (!detailContentArea) return;
    
    // 날짜 포맷팅: YYYYMMDD -> YYYY.MM.DD
    const formatDateFull = (str) => {
        if (!str || str.length < 8) return str;
        return `${str.substring(0,4)}.${str.substring(4,6)}.${str.substring(6,8)}`;
    };

    const periodStr = (intro?.eventstartdate && intro?.eventenddate) 
        ? `${formatDateFull(intro.eventstartdate)} ~ ${formatDateFull(intro.eventenddate)}`
        : '정보 없음';

    // 주차 정보: intro에 없을 경우 overview에서 검색 시도
    let parkingInfo = intro?.parkingfestival || '';
    if (!parkingInfo && item.overview) {
        const parkingMatch = item.overview.match(/주차[가-힣\s]*:[가-힣\s0-9,]+/);
        if (parkingMatch) parkingInfo = parkingMatch[0];
    }

    detailContentArea.innerHTML = `
        <img src="${item.firstimage || 'https://via.placeholder.com/600x400?text=Festimap'}" class="detail-img" alt="${item.title}">
        <div class="detail-body">
            <h1 style="margin-bottom:12px;">${item.title}</h1>
            <p style="margin-bottom:24px; color:var(--color-text-tertiary);">${item.addr1 || '상세 주소 정보 없음'}</p>
            
            <div class="info-card">
                <div class="info-row">
                    <span class="info-icon">🗓️</span>
                    <div class="info-content">
                        <span class="info-label">행사 기간</span>
                        <span class="info-value">${periodStr}</span>
                    </div>
                </div>
                ${intro?.usetimefestival ? `
                <div class="info-row">
                    <span class="info-icon">🎫</span>
                    <div class="info-content">
                        <span class="info-label">입장료</span>
                        <span class="info-value">${intro.usetimefestival}</span>
                    </div>
                </div>` : ''}
                ${parkingInfo ? `
                <div class="info-row">
                    <span class="info-icon">🚗</span>
                    <div class="info-content">
                        <span class="info-label">주차 정보</span>
                        <span class="info-value">${parkingInfo}</span>
                    </div>
                </div>` : ''}
            </div>

            <div class="card" style="padding:16px; background-color:var(--color-bg); border-radius:16px; margin-top:16px;">
                <h3 style="margin-bottom:8px;">축제 소개</h3>
                <p style="font-size:14px; line-height:1.7;">${item.overview || '행사 설명이 등록되지 않았습니다.'}</p>
            </div>
            
            <div class="map-links">
                <button class="btn btn-map btn-naver" onclick="window.open('https://map.naver.com/v5/search/${encodeURIComponent(item.title)}', '_blank')">
                    네이버 지도
                </button>
                <button class="btn btn-map btn-kakao" onclick="window.open('https://map.kakao.com/link/search/${encodeURIComponent(item.title)}', '_blank')">
                    카카오맵
                </button>
            </div>

            <button class="btn btn-primary" style="margin-top:12px; width:100%;" onclick="window.open('https://search.naver.com/search.naver?query=${encodeURIComponent(item.title)}', '_blank')">
                네이버에서 더 알아보기
            </button>
        </div>
    `;
}

/**
 * Toggle Favorite
 */
function toggleFavorite(id, element) {
    const index = favoriteIds.indexOf(id);
    if (index > -1) {
        favoriteIds.splice(index, 1);
        element.classList.remove('active');
        element.innerText = '🤍';
    } else {
        favoriteIds.push(id);
        element.classList.add('active');
        element.innerText = '❤️';
    }
    saveFavorites();
}

// --- Bootstrap ---
window.onload = initializeApp;
window.hideBottomSheet = hideBottomSheet; // Expose for inline onclick
