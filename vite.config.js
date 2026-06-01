import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 平板 session — 依 F 區 SYNC-SPEC §1.1 寫死 port 5175。
// host: true 讓 iPad 能透過 PC 的 LAN IP 連到這個 dev server。
export default defineConfig({
  plugins: [react()],
  server: { port: 5175, strictPort: true, host: true },
})
