(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function n(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=n(s);fetch(s.href,a)}})();const E="d1505c3954d37e35a7ffeeeec74de7fc5b218dfbce9125763c52a4085ce79cfe",A="https://apis.data.go.kr/B551011/KorService2",j="https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0",K=document.getElementById("area-select"),D=document.getElementById("date-input"),x=document.getElementById("search-btn"),P=document.getElementById("nearby-btn"),N=document.getElementById("loading"),T=document.getElementById("festival-list"),w=document.getElementById("result-count"),H=document.getElementById("detail-modal"),_=document.getElementById("close-modal"),S=document.getElementById("detail-content"),U={1:["서울","서울특별시"],2:["인천","인천광역시"],3:["대전","대전광역시"],4:["대구","대구광역시"],5:["광주","광주광역시"],6:["부산","부산광역시"],7:["울산","울산광역시"],8:["세종","세종특별자치시"],31:["경기","경기도"],32:["강원","강원특별자치도"],33:["충북","충청북도"],34:["충남","충청남도"],35:["경북","경상북도"],36:["경남","경상남도"],37:["전북","전북특별자치도"],38:["전남","전라남도"],39:["제주","제주특별자치도"]},F=new Date,Y=F.getTimezoneOffset()*6e4,B=new Date(F-Y).toISOString().slice(0,10);D&&(D.value=B,console.log("Date initialized to:",B));function W(){x&&(x.onclick=()=>{console.log("Search button clicked"),k(!1)}),P&&(P.onclick=()=>{console.log("Nearby button clicked"),k(!0)}),_&&(_.onclick=()=>{H.classList.remove("active"),document.body.style.overflow=""})}W();function V(e,t,n){const i=6371.00877,s=5,a=30,o=60,d=126,l=38,r=43,p=136,c=Math.PI/180,h=i/s,f=a*c,g=o*c,v=d*c,I=l*c;let u=Math.tan(Math.PI*.25+g*.5)/Math.tan(Math.PI*.25+f*.5);u=Math.log(Math.cos(f)/Math.cos(g))/Math.log(u);let m=Math.tan(Math.PI*.25+f*.5);m=Math.pow(m,u)*Math.cos(f)/u;let y=Math.tan(Math.PI*.25+I*.5);y=h*m/Math.pow(y,u);let $={};{$.lat=t,$.lng=n;let b=Math.tan(Math.PI*.25+t*c*.5);b=h*m/Math.pow(b,u);let M=n*c-v;M>Math.PI&&(M-=2*Math.PI),M<-Math.PI&&(M+=2*Math.PI),M*=u,$.x=Math.floor(b*Math.sin(M)+r+.5),$.y=Math.floor(y-b*Math.cos(M)+p+.5)}return $}async function k(e){R(!0),T.innerHTML="",w.innerText="축제 검색 중...";const t=D.value.replace(/-/g,""),n=parseInt(t),i=K.value;try{let s=await C(e,i,t);if(!e&&i&&(!s||s.length===0)){w.innerText="검색 결과를 상세히 분석 중입니다...";const a=await C(!1,"",t);if(a){const o=U[i];s=a.filter(d=>o.some(l=>{var r;return(r=d.addr1)==null?void 0:r.includes(l)}))}}if(!s||s.length===0)T.innerHTML=`<div class="empty-state">${e?"주변 20km 이내에 진행 중인 축제가 없습니다.":"현재 조회된 축제가 없습니다."}</div>`,w.innerText="축제 목록 (0)";else{let a=Array.isArray(s)?s:[s];a=a.filter(o=>{const d=parseInt(o.eventstartdate),l=parseInt(o.eventenddate);return isNaN(d)||isNaN(l)?!1:d<=n&&l>=n}),a.length===0?(T.innerHTML='<div class="empty-state">해당 날짜에 진행 중인 축제가 없습니다.</div>',w.innerText="축제 목록 (0)"):(X(a),w.innerText=`축제 목록 (${a.length})`)}}catch(s){T.innerHTML=`<div class="empty-state">데이터를 가져오는 중 오류가 발생했습니다.<br><small>${s.message}</small></div>`,w.innerText="오류 발생"}finally{R(!1)}}async function C(e,t,n){var o,d,l;let i="";if(e){const r=await new Promise((h,f)=>{navigator.geolocation.getCurrentPosition(h,f,{timeout:1e4})}),{latitude:p,longitude:c}=r.coords;i=`${A}/locationBasedList2?serviceKey=${E}&numOfRows=150&pageNo=1&MobileOS=ETC&MobileApp=TossFestival&_type=json&mapX=${c}&mapY=${p}&radius=20000&contentTypeId=15&arrange=A`}else{const r=new Date(D.value);r.setDate(r.getDate()-100);const p=r.toISOString().split("T")[0].replace(/-/g,"");i=`${A}/searchFestival2?serviceKey=${E}&numOfRows=1000&pageNo=1&MobileOS=ETC&MobileApp=TossFestival&_type=json&arrange=C&eventStartDate=${p}${t?`&areaCode=${t}`:""}`}const s=await fetch(i);if(!s.ok)throw new Error("API 호출 실패");return(l=(d=(o=(await s.json()).response)==null?void 0:o.body)==null?void 0:d.items)==null?void 0:l.item}function X(e){T.innerHTML=e.map(t=>{var n;return`
        <div class="festival-card" onclick="openDetail('${t.contentid}')">
            <img src="${t.firstimage||"https://via.placeholder.com/150?text=No+Image"}" class="card-image" alt="${t.title}">
            <div class="card-info">
                <div class="card-title">${t.title}</div>
                <div class="card-meta">${O(t.eventstartdate)} ~ ${O(t.eventenddate)}</div>
                <div class="card-meta">${t.addr1||""}</div>
                <span class="card-tag">${((n=t.addr1)==null?void 0:n.split(" ")[0])||"축제"}</span>
            </div>
        </div>
    `}).join("")}async function z(e){var t,n,i,s,a,o,d,l,r,p;H.classList.add("active"),document.body.style.overflow="hidden",S.innerHTML=`
        <div class="loading-spinner" style="display: flex;">
            <div class="spinner"></div>
            <p>상세 정보를 불러오고 있어요</p>
        </div>
    `;try{const c=`${A}/detailCommon2?serviceKey=${E}&MobileOS=ETC&MobileApp=TossFestival&_type=json&contentId=${e}`,f=await(await fetch(c)).json();if(((n=(t=f.response)==null?void 0:t.header)==null?void 0:n.resultCode)!=="0000")throw new Error(((s=(i=f.response)==null?void 0:i.header)==null?void 0:s.resultMsg)||"API Error");const g=(d=(o=(a=f.response)==null?void 0:a.body)==null?void 0:o.items)==null?void 0:d.item,v=Array.isArray(g)?g[0]:g;if(!v)throw new Error("상세 정보를 찾을 수 없습니다.");const I=`${A}/detailIntro2?serviceKey=${E}&MobileOS=ETC&MobileApp=TossFestival&_type=json&contentId=${e}&contentTypeId=15`,y=(p=(r=(l=(await(await fetch(I)).json()).response)==null?void 0:l.body)==null?void 0:r.items)==null?void 0:p.item,$=Array.isArray(y)?y[0]:y;let b=null;v&&v.mapx&&v.mapy&&(b=await G(v.mapx,v.mapy)),q(v,$,b)}catch(c){S.innerHTML=`<div class="empty-state">상세 정보를 불러오지 못했습니다.<br><small>${c.message}</small></div>`}}window.openDetail=z;async function G(e,t){var l,r,p,c,h;const n=V("toXY",parseFloat(t),parseFloat(e)),i=new Date;i.getMinutes()<40&&i.setHours(i.getHours()-1);const a=i.toISOString().split("T")[0].replace(/-/g,"");let o=i.getHours();const d=(o<10?"0"+o:o)+"00";try{const f=`${j}/getUltraSrtNcst?serviceKey=${E}&numOfRows=10&pageNo=1&_type=json&base_date=${a}&base_time=${d}&nx=${n.x}&ny=${n.y}`,v=await(await fetch(f)).json();if(((r=(l=v.response)==null?void 0:l.header)==null?void 0:r.resultCode)!=="0000")return null;const I=(h=(c=(p=v.response)==null?void 0:p.body)==null?void 0:c.items)==null?void 0:h.item;if(I){const u={};return I.forEach(m=>{m.category==="T1H"&&(u.temp=m.obsrValue),m.category==="PTY"&&(u.pty=m.obsrValue)}),u}}catch(f){console.error("Weather API fetch error:",f)}return null}function q(e,t,n){e&&(S.innerHTML=`
        <img src="${e.firstimage||"https://via.placeholder.com/400x250?text=No+Image"}" class="detail-image" alt="${e.title}">
        
        <div class="detail-body">
            <h1 class="detail-title">${e.title}</h1>
            
            ${n?`
            <div class="weather-card">
                <div class="weather-icon">${J(n.pty)}</div>
                <div>
                    <div class="weather-temp">${n.temp}°</div>
                    <div class="weather-desc">실시간 기상 정보</div>
                </div>
            </div>
            `:""}

            <div class="info-item">
                <div class="info-label">장소</div>
                <div class="info-value">${e.addr1||"정보 없음"} ${e.addr2||""}</div>
            </div>

            ${t!=null&&t.placeinfo?`
            <div class="info-item">
                <div class="info-label">장소/주차 안내</div>
                <div class="info-value">${L(t.placeinfo)}</div>
            </div>
            `:""}

            <div class="nav-buttons">
                <button class="btn-nav" onclick="openNav('kakao', '${e.title}', ${e.mapy}, ${e.mapx})">
                    카카오맵 길찾기
                </button>
                <button class="btn-nav" onclick="openNav('naver', '${e.title}', ${e.mapy}, ${e.mapx})">
                    네이버지도 길찾기
                </button>
            </div>

            ${e.eventstartdate?`
            <div class="info-item">
                <div class="info-label">일시</div>
                <div class="info-value">${O(e.eventstartdate)} ~ ${O(e.eventenddate)||""}</div>
            </div>
            `:""}

            ${t!=null&&t.usetimefestival?`
            <div class="info-item">
                <div class="info-label">이용요금</div>
                <div class="info-value">${L(t.usetimefestival)}</div>
            </div>
            `:""}

            ${t!=null&&t.playtime?`
            <div class="info-item">
                <div class="info-label">이용시간</div>
                <div class="info-value">${L(t.playtime)}</div>
            </div>
            `:""}

            <div class="info-item">
                <div class="info-label">상세 설명</div>
                <div class="info-value">${L(e.overview)||"설명이 없습니다."}</div>
            </div>
        </div>
    `)}window.openNav=(e,t,n,i)=>{let s="";e==="kakao"?s=`https://map.kakao.com/link/to/${encodeURIComponent(t)},${n},${i}`:s=`https://map.naver.com/v5/search/${encodeURIComponent(t)}/place/${n},${i}`,window.open(s,"_blank")};function R(e){N&&(N.style.display=e?"flex":"none")}function O(e){return!e||e.length!==8?e:`${e.substring(0,4)}.${e.substring(4,6)}.${e.substring(6,8)}`}function L(e){return e&&new DOMParser().parseFromString(e,"text/html").body.textContent||""}function J(e){return e==="0"?"☀️":e==="1"?"🌧️":e==="2"?"🌨️":e==="3"?"❄️":"⛅"}
