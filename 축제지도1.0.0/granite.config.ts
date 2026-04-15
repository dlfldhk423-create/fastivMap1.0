import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 앱인토스 콘솔의 'appName' 필드와 일치해야 합니다.
  appName: 'anthony-gil',
  
  // 앱 유형 설정
  appType: 'general',
  
  // 브랜드 정보 및 메타데이터 추가
  brand: {
    displayName: '축제지도',
    primaryColor: '#3182f7',
    icon: './icon.png',
  },

  // 권한 설정 (위치 기반 서비스 사용을 위해 객체 형식으로 입력)
  permissions: [
    { name: 'geolocation', access: 'access' }
  ],

  // 웹 설정 (Vite 관련)
  web: {
    port: 5173,
    commands: {
      dev: 'npm run dev',
      build: 'npm run build',
    },
  },

  // 미니앱의 시작 지점을 설정합니다.
  serviceEndpoint: '/',
  
  // 빌드 결과물이 저장될 경로입니다.
  outdir: 'dist',
});
