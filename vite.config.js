import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 平板 session — 依 F 區 SYNC-SPEC §1.1 寫死 port 5175。
// host: true 讓 iPad 能透過 PC 的 LAN IP 連到這個 dev server。
export default defineConfig({
  // ⚠ 相對 base：靜態部署時整包可以放在任何子路徑底下（GitHub Pages 的
  //    專案站是 /<repo>/）。寫死 '/' 的話 build 出來的資產路徑會全部 404。
  //    這一版沒有前端路由，所以相對路徑不會有 history fallback 的問題。
  base: './',
  plugins: [react()],
  server: { port: 5175, strictPort: true, host: true },
})
