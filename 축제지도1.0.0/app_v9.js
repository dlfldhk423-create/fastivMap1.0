import { getAnonymousKey } from '@apps-in-toss/web-framework';

// --- Existing App Logic ---

// Configuration (Environment Variables)
const API_KEY = import.meta.env.VITE_TOUR_API_KEY;
const TOUR_BASE_URL = import.meta.env.VITE_TOUR_BASE_URL;
const WEATHER_BASE_URL = import.meta.env.VITE_WEATHER_BASE_URL;

// Global States
let map = null;
let userKey = null;
let favorites = new Set();

// DOM Elements
const areaSelect = document.getElementById('area-select');
const dateInput = document.getElementById('date-input');
const todayBtn = document.getElementById('today-btn');
const searchBtn = document.getElementById('search-btn');
const nearbyBtn = document.getElementById('nearby-btn');
const loading = document.getElementById('loading');
const festivalList = document.getElementById('festival-list');
const resultCount = document.getElementById('result-count');
const recommendationContainer = document.getElementById('recommendation-container');
const recommendationList = document.getElementById('recommendation-list');
const detailModal = document.getElementById('detail-modal');
const closeModal = document.getElementById('close-modal');
const detailContent = document.getElementById('detail-content');

// Area Name Mapping (for robust address filtering)
const AREA_NAMES = {
    "1": ["서울", "서울특별시"],
    "2": ["인천", "인천광역시"],
    "3": ["대전", "대전광역시"],
    "4": ["대구", "대구광역시"],
    "5": ["광주", "광주광역시"],
    "6": ["부산", "부산광역시"],
    "7": ["울산", "울산광역시"],
    "8": ["세종", "세종특별자치시"],
    "31": ["경기", "경기도"],
    "32": ["강원", "강원특별자치도"],
    "33": ["충북", "충청북도"],
    "34": ["충남", "충청남도"],
    "35": ["경북", "경상북도"],
    "36": ["경남", "경상남도"],
    "37": ["전북", "전북특별자치도"],
    "38": ["전남", "전라남도"],
    "39": ["제주", "제주특별자치도"]
};

// Administrative District Codes for robust filtering (lDongRegnCd)
const ADMIN_CODES = {
    "1": ["11"], "2": ["28"], "3": ["30"], "4": ["27"], "5": ["29"],
    "6": ["26"], "7": ["31"], "8": ["36"], "31": ["41"], "32": ["42", "51"],
    "33": ["43"], "34": ["44"], "35": ["47"], "36": ["48"], "37": ["45", "52"],
    "38": ["46"], "39": ["50"]
};

// Set default date to today (Local Timezone Fix)
function getTodayISO() {
    // Correct local date string (YYYY-MM-DD) across all timezones
    return new Date().toLocaleDateString('en-CA');
}

const localISOTime = getTodayISO();

if (dateInput) {
    dateInput.value = localISOTime;
    console.log('Date initialized to:', localISOTime);
}

// Event Listeners
function initEventListeners() {
    if (todayBtn) {
        todayBtn.onclick = () => {
            if (dateInput) dateInput.value = getTodayISO();
        };
    }
    if (searchBtn) {
        searchBtn.onclick = (e) => {
            if (e) e.preventDefault();
            console.log('Search button clicked');
            searchFestivals(false);
        };
    }
    if (nearbyBtn) {
        nearbyBtn.onclick = (e) => {
            if (e) e.preventDefault();
            console.log('Nearby button clicked');
            searchFestivals(true);
        };
    }
    if (closeModal) {
        closeModal.onclick = () => {
            detailModal.classList.remove('active');
            document.body.style.overflow = '';
        };
    }
}

// Initialize on load
async function initializeApp() {
    initEventListeners();
    
    try {
        // Initialize User Identification Key (Anonymous Key)
        // Non-game mini-apps should use getAnonymousKey for consent-less identification
        const result = await getAnonymousKey();
        userKey = result?.anonymousKey;
        console.log('User identifying key issued:', userKey);
        
        // Load favorites from local storage (keyed by userKey for future multi-user support)
        loadFavorites();

        // Load Recommended Festivals for the main screen
        loadRecommendations();
    } catch (error) {
        console.error('Failed to get anonymous key:', error);
        // Fallback or handle error
    }
}

initializeApp();

// Favorites Logic
function loadFavorites() {
    const key = userKey || 'guest';
    const saved = localStorage.getItem(`fest_fav_${key}`);
    if (saved) {
        favorites = new Set(JSON.parse(saved));
    } else {
        favorites = new Set();
    }
}

function saveFavorites() {
    const key = userKey || 'guest';
    localStorage.setItem(`fest_fav_${key}`, JSON.stringify(Array.from(favorites)));
}

function toggleFavorite(contentId, event) {
    if (event) event.stopPropagation(); // Prevent opening detail when clicking heart
    
    if (favorites.has(contentId)) {
        favorites.delete(contentId);
    } else {
        favorites.add(contentId);
    }
    
    saveFavorites();
    
    // Update UI elements that show this status
    updateFavoriteUI(contentId);
}

function isFavorite(contentId) {
    return favorites.has(contentId);
}

function updateFavoriteUI(contentId) {
    // Update all hearts in the list
    const listHearts = document.querySelectorAll(`.btn-favorite[data-id="${contentId}"]`);
    listHearts.forEach(h => h.classList.toggle('active', isFavorite(contentId)));
    
    // Update heart in the detail view if open
    const detailHeart = document.querySelector(`.detail-favorite-header-btn[data-id="${contentId}"]`);
    if (detailHeart) detailHeart.classList.toggle('active', isFavorite(contentId));
}

// Global scope expose for favorites
window.toggleFavorite = toggleFavorite;

// Recommendation Logic
async function loadRecommendations() {
    try {
        const todayStr = localISOTime.replace(/-/g, '');
        // Fetch nationwide data to pick recommendations
        const allFestivals = await fetchList(false, '', todayStr);
        
        if (allFestivals && allFestivals.length > 0) {
            // Pick 10 festivals that have images
            const recommended = allFestivals
                .filter(item => item.firstimage)
                .slice(0, 10);
            
            if (recommended.length > 0) {
                renderRecommendations(recommended);
                recommendationContainer.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Failed to load recommendations:', error);
    }
}

function renderRecommendations(items) {
    recommendationList.innerHTML = items.map(item => `
        <div class="recommend-card" onclick="openDetail('${item.contentid}')">
            <img src="${item.firstimage}" class="recommend-image" alt="${item.title}">
            <div class="recommend-title">${item.title}</div>
        </div>
    `).join('');
}

// Coordinate conversion (Lat/Lng -> Grid X/Y) for KMA Weather API
function dfs_xy_conv(code, v1, v2) {
    const RE = 6371.00877; 
    const GRID = 5.0; 
    const SLAT1 = 30.0; 
    const SLAT2 = 60.0; 
    const OLON = 126.0; 
    const OLAT = 38.0; 
    const XO = 43; 
    const YO = 136; 

    const DEGRAD = Math.PI / 180.0;
    const RADDEG = 180.0 / Math.PI;

    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);

    let rs = {};
    if (code == "toXY") {
        rs['lat'] = v1;
        rs['lng'] = v2;
        let ra = Math.tan(Math.PI * 0.25 + (v1) * DEGRAD * 0.5);
        ra = re * sf / Math.pow(ra, sn);
        let theta = v2 * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;
        rs['x'] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
        rs['y'] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
    }
    return rs;
}

// Search Festivals
async function searchFestivals(isNearby) {
    showLoading(true);
    festivalList.innerHTML = '';
    resultCount.innerText = '축제 검색 중...';

    const selectedDateStr = dateInput.value.replace(/-/g, '');
    const selectedDate = parseInt(selectedDateStr);
    const areaCode = areaSelect.value;

    try {
        let items = await fetchList(isNearby, areaCode, selectedDateStr);
        
        // If an area is selected, we perform more robust filtering by addressing potential API data omissions
        if (!isNearby && areaCode) {
            // Merge results: original areacode filtered results + address-based keyword filtering
            const targetAreaKeywords = AREA_NAMES[areaCode];
            
            // If items exist, they are already filtered by areaCode at the API level.
            // But we still want to find items that might have been missed due to missing areacode field in the API database.
            // So we always fetch the global (nationwide) list to find missing items.
            resultCount.innerText = '더 많은 축제를 찾는 중...';
            const globalItems = await fetchList(false, '', selectedDateStr);
            
            if (globalItems) {
                const targetAdminCodes = ADMIN_CODES[areaCode] || [];
                const filteredGlobal = globalItems.filter(item => {
                    // Include if address contains the area keywords OR if the areacode matches OR if admin code matches
                    const matchesAddress = targetAreaKeywords.some(keyword => item.addr1?.includes(keyword));
                    const matchesAreaCode = String(item.areacode) === String(areaCode);
                    const matchesAdminCode = targetAdminCodes.includes(String(item.lDongRegnCd));
                    
                    return matchesAddress || matchesAreaCode || matchesAdminCode;
                });
                
                // Combine and remove duplicates (by contentid)
                const combined = [...(items || [])];
                const existingIds = new Set(combined.map(i => i.contentid));
                
                filteredGlobal.forEach(item => {
                    if (!existingIds.has(item.contentid)) {
                        combined.push(item);
                        existingIds.add(item.contentid);
                    }
                });
                items = combined;
            }
        }

        if (!items || items.length === 0) {
            festivalList.innerHTML = `<div class="empty-state">${isNearby ? '주변 20km 이내에 진행 중인 축제가 없습니다.' : '현재 조회된 축제가 없습니다.'}</div>`;
            resultCount.innerText = '축제 목록 (0)';
        } else {
            let itemList = Array.isArray(items) ? items : [items];
            
            itemList = itemList.filter(item => {
                const sDate = parseInt(item.eventstartdate);
                const eDate = parseInt(item.eventenddate);
                
                // Ensure sDate and eDate are valid numbers before comparison
                if (isNaN(sDate) || isNaN(eDate)) return false;
                
                return sDate <= selectedDate && eDate >= selectedDate;
            });

            if (itemList.length === 0) {
                festivalList.innerHTML = '<div class="empty-state">해당 날짜에 진행 중인 축제가 없습니다.</div>';
                resultCount.innerText = '축제 목록 (0)';
            } else {
                renderFestivalList(itemList);
                resultCount.innerText = `축제 목록 (${itemList.length})`;
            }
        }
    } catch (error) {
        festivalList.innerHTML = `<div class="empty-state">데이터를 가져오는 중 오류가 발생했습니다.<br><small>${error.message}</small></div>`;
        resultCount.innerText = '오류 발생';
    } finally {
        showLoading(false);
    }
}

// Fetch Helper
async function fetchList(isNearby, areaCode, targetDateStr) {
    let url = '';
    if (isNearby) {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        const { latitude, longitude } = position.coords;
        url = `${TOUR_BASE_URL}/locationBasedList2?serviceKey=${API_KEY}&numOfRows=150&pageNo=1&MobileOS=ETC&MobileApp=TossFestival&_type=json&mapX=${longitude}&mapY=${latitude}&radius=20000&contentTypeId=15&arrange=A`;
    } else {
        const dateObj = new Date(dateInput.value);
        dateObj.setDate(dateObj.getDate() - 100);
        const searchStartDate = dateObj.toISOString().split('T')[0].replace(/-/g, '');
        // Always fetch a large nationwide set if no areaCode is provided, OR even if it is provided, 
        // we might ignore it to prevent missing data in areacode-omitted records.
        // However, to satisfy both, we'll keep the API-side filtering as an initial step.
        url = `${TOUR_BASE_URL}/searchFestival2?serviceKey=${API_KEY}&numOfRows=1000&pageNo=1&MobileOS=ETC&MobileApp=TossFestival&_type=json&arrange=C&eventStartDate=${searchStartDate}${areaCode ? `&areaCode=${areaCode}` : ''}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('API 호출 실패');
    const data = await response.json();
    return data.response?.body?.items?.item;
}

// Render Festival List
function renderFestivalList(items) {
    festivalList.innerHTML = items.map(item => `
        <div class="festival-card" onclick="openDetail('${item.contentid}')">
            <button class="btn-favorite ${isFavorite(item.contentid) ? 'active' : ''}" 
                    data-id="${item.contentid}"
                    onclick="toggleFavorite('${item.contentid}', event)">
                ♥
            </button>
            <img src="${item.firstimage || 'https://via.placeholder.com/150?text=No+Image'}" class="card-image" alt="${item.title}">
            <div class="card-info">
                <div class="card-title">${item.title}</div>
                <div class="card-meta">${formatDate(item.eventstartdate)} ~ ${formatDate(item.eventenddate)}</div>
                <div class="card-meta">${item.addr1 || ''}</div>
                <span class="card-tag">${item.addr1?.split(' ')[0] || '축제'}</span>
            </div>
        </div>
    `).join('');
}

// Open Detail Modal
async function openDetail(contentId) {
    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Update modal header with favorite button
    const headerTitle = detailModal.querySelector('h3');
    if (headerTitle) {
        // Clear previous favorite button if exists
        const oldFav = detailModal.querySelector('.detail-favorite-header-btn');
        if (oldFav) oldFav.remove();
        
        const favBtn = document.createElement('button');
        favBtn.className = `detail-favorite-header-btn ${isFavorite(contentId) ? 'active' : ''}`;
        favBtn.dataset.id = contentId;
        favBtn.innerHTML = '♥';
        favBtn.onclick = () => toggleFavorite(contentId);
        headerTitle.after(favBtn);
    }

    detailContent.innerHTML = `
        <div class="loading-spinner" style="display: flex;">
            <div class="spinner"></div>
            <p>상세 정보를 불러오고 있어요</p>
        </div>
    `;

    try {
        const safeUrl = `${TOUR_BASE_URL}/detailCommon2?serviceKey=${API_KEY}&MobileOS=ETC&MobileApp=TossFestival&_type=json&contentId=${contentId}`;
        const response = await fetch(safeUrl);
        const data = await response.json();
        
        if (data.response?.header?.resultCode !== '0000') {
            throw new Error(data.response?.header?.resultMsg || 'API Error');
        }

        const commonItems = data.response?.body?.items?.item;
        const commonItem = Array.isArray(commonItems) ? commonItems[0] : commonItems;

        if (!commonItem) throw new Error('상세 정보를 찾을 수 없습니다.');

        const introUrl = `${TOUR_BASE_URL}/detailIntro2?serviceKey=${API_KEY}&MobileOS=ETC&MobileApp=TossFestival&_type=json&contentId=${contentId}&contentTypeId=15`;
        const introRes = await fetch(introUrl);
        const introData = await introRes.json();
        const introItems = introData.response?.body?.items?.item;
        const introItem = Array.isArray(introItems) ? introItems[0] : introItems;

        let weatherData = null;
        if (commonItem && commonItem.mapx && commonItem.mapy) {
            weatherData = await fetchWeather(commonItem.mapx, commonItem.mapy);
        }

        renderDetail(commonItem, introItem, weatherData);
        
    } catch (error) {
        detailContent.innerHTML = `<div class="empty-state">상세 정보를 불러오지 못했습니다.<br><small>${error.message}</small></div>`;
    }
}

// Global scope expose for inline onclick
window.openDetail = openDetail;

// Fetch Weather Data
async function fetchWeather(lng, lat) {
    const grid = dfs_xy_conv("toXY", parseFloat(lat), parseFloat(lng));
    const now = new Date();
    
    const minutes = now.getMinutes();
    if (minutes < 40) {
        now.setHours(now.getHours() - 1);
    }
    
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    let hour = now.getHours();
    const timeStr = (hour < 10 ? '0' + hour : hour) + '00';

    try {
        const url = `${WEATHER_BASE_URL}/getUltraSrtNcst?serviceKey=${API_KEY}&numOfRows=10&pageNo=1&_type=json&base_date=${dateStr}&base_time=${timeStr}&nx=${grid.x}&ny=${grid.y}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.response?.header?.resultCode !== '0000') {
            return null;
        }

        const items = data.response?.body?.items?.item;
        if (items) {
            const weather = {};
            items.forEach(i => {
                if (i.category === 'T1H') weather.temp = i.obsrValue; 
                if (i.category === 'PTY') weather.pty = i.obsrValue; 
            });
            return weather;
        }
    } catch (e) {
        console.error('Weather API fetch error:', e);
    }
    return null;
}

// Render Detail View
function renderDetail(common, intro, weather) {
    if (!common) return;

    detailContent.innerHTML = `
        <img src="${common.firstimage || 'https://via.placeholder.com/400x250?text=No+Image'}" class="detail-image" alt="${common.title}">
        
        <div class="detail-body">
            <h1 class="detail-title">${common.title}</h1>
            
            ${weather ? `
            <div class="weather-card">
                <div class="weather-icon">${getWeatherIcon(weather.pty)}</div>
                <div>
                    <div class="weather-temp">${weather.temp}°</div>
                    <div class="weather-desc">실시간 기상 정보</div>
                </div>
            </div>
            ` : ''}

            <div class="info-item">
                <div class="info-label">장소</div>
                <div class="info-value">${common.addr1 || '정보 없음'} ${common.addr2 || ''}</div>
            </div>

            ${intro?.placeinfo ? `
            <div class="info-item">
                <div class="info-label">장소/주차 안내</div>
                <div class="info-value">${cleanText(intro.placeinfo)}</div>
            </div>
            ` : ''}

            <div class="nav-buttons">
                <button class="btn-nav" onclick="openNav('kakao', '${common.title}', ${common.mapy}, ${common.mapx})">
                    카카오맵 길찾기
                </button>
                <button class="btn-nav" onclick="openNav('naver', '${common.title}', ${common.mapy}, ${common.mapx})">
                    네이버지도 길찾기
                </button>
            </div>

            ${common.eventstartdate ? `
            <div class="info-item">
                <div class="info-label">일시</div>
                <div class="info-value">${formatDate(common.eventstartdate)} ~ ${formatDate(common.eventenddate) || ''}</div>
            </div>
            ` : ''}

            ${intro?.usetimefestival ? `
            <div class="info-item">
                <div class="info-label">이용요금</div>
                <div class="info-value">${cleanText(intro.usetimefestival)}</div>
            </div>
            ` : ''}

            ${intro?.playtime ? `
            <div class="info-item">
                <div class="info-label">이용시간</div>
                <div class="info-value">${cleanText(intro.playtime)}</div>
            </div>
            ` : ''}

            <div class="info-item">
                <div class="info-label">상세 설명</div>
                <div class="info-value">${cleanText(common.overview) || '설명이 없습니다.'}</div>
            </div>
        </div>
    `;
}

// Global scope expose for inline onclick
window.openNav = (type, name, lat, lng) => {
    let url = '';
    if (type === 'kakao') {
        url = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
    } else {
        url = `https://map.naver.com/v5/search/${encodeURIComponent(name)}/place/${lat},${lng}`;
    }
    window.open(url, '_blank');
};

// Helper Functions
function showLoading(show) {
    if (loading) loading.style.display = show ? 'flex' : 'none';
}

function formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
}

function cleanText(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

function getWeatherIcon(pty) {
    if (pty === '0') return '☀️'; 
    if (pty === '1') return '🌧️'; 
    if (pty === '2') return '🌨️'; 
    if (pty === '3') return '❄️'; 
    return '⛅';
}
