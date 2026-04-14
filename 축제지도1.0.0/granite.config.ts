import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 앱인토스 콘솔에 등록된 앱 이름과 일치해야 합니다.
  appName: 'festival-search',
  
  // 미니앱의 시작 지점을 설정합니다.
  // 로컬 개발 시에는 /가 index.html을 가리킵니다.
  serviceEndpoint: '/',
  
  // 빌드 결과물이 저장될 경로입니다.
  outDir: 'dist',
});
