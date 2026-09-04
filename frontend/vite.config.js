import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    host: true, // 로컬 네트워크(LAN) IP 개방
    port: 5173,

    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,


        rewrite: (path) => path.replace(/^\/api/, ''),

      //  autoRewrite: true,
      },

      '/streams': {
              target: 'http://localhost:8080',
              changeOrigin: true,
              secure: false,
              ws: true, // 만약 /streams도 웹소켓이라면 true로 설정
            },

    // 🌟 웹소켓 시그널링 프록시 필수 추가
        '/signal': {
          target: 'http://localhost:8080',
          ws: true,           // 웹소켓 프로토콜 업그레이드 허용
          changeOrigin: true,
          secure: false,
    },

    // 멘토링 1:1 채팅 실시간 전달용 STOMP 엔드포인트
        '/ws-chat': {
          target: 'http://localhost:8080',
          ws: true,
          changeOrigin: true,
          secure: false,
    },
    },
  },
})