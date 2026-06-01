# F-Ipad — AI 大腦控制塔(平板端)

寶鋪數位孿生展示 **F 區** 的平板互動介面。觀眾將實體家電裝置放上 NFC 感應區,平板上的知識圖譜便逐一亮起、連結到中央「AI 大腦」,全部串上後播放全屋串聯的完成動畫。

此 app 是 F 區三端同步顯示的其中一端,三端共用同一台 Python WebSocket server:

| 端       | Port | 角色                       |
| -------- | ---- | -------------------------- |
| 桌面投影 | 5173 | 主視覺投影                 |
| 牆面投影 | 5174 | 牆面場景                   |
| **平板** | 5175 | **本專案** — 觀眾互動 / 操作 |
| WS server | 8787 | 接 NFC reader 的那台 PC    |

> 這是一個跑在 iPad Safari 上的網頁,不是原生 App。

## 技術棧

- Vite 5 + React 18
- framer-motion 11(光束、邊線繪入、完成浮層動畫)
- 原生 WebSocket(無額外 client 函式庫)

## 安裝與啟動

```bash
npm install
npm run dev        # http://localhost:5175
```

其他指令:

```bash
npm run build      # 產生 dist/
npm run preview    # 預覽 build 結果(port 5175)
```

dev server 已開 `host: true`,iPad 可透過 PC 的 LAN IP 連入。

## 在 iPad 上展演

1. 在接 NFC reader 的 PC 上啟動 WS server(:8787)與本 dev server(:5175)。
2. iPad 與 PC 連同一個區網。
3. iPad Safari 開 `http://<PC的IP>:5175`。

WS 連線位址由 `location.hostname` 自動推導(`ws://<同一個 host>:8787`),所以同一份程式碼在 PC 上測試與 iPad 上展演都不需改設定。

### 網址參數

| 參數       | 說明                                                         |
| ---------- | ------------------------------------------------------------ |
| `?sim=1`   | 模擬模式:不連 WS,改用鍵盤驗證視覺。`1`–`9` 切換對應家電,`0` 全部清空。 |
| `?ws=host` | 手動覆寫 WS 主機(debug 用),例:`?ws=192.168.0.10`。        |

## Session 同步(歡迎頁 / 重置)

歡迎頁與重置不是各端各自為政,而是透過 WS 廣播讓三端一起切換:

- 平板點歡迎頁 → 送 `{"type":"session-start"}` → server 廣播 → 三端離開歡迎頁進主畫面。
- 平板右下角「↺ 重置」鈕 → 送 `{"type":"session-end"}` → 三端一起回歡迎頁。
- 反向亦然:任一端送出 session 訊息,本端都會同步;新連上的客戶端會收到當前 session 狀態。

> 之後的工作人員全局控制平板沿用同一套協定即可,不需改 server。

WS 連不上(或 `?sim=1`)時,歡迎頁 / 重置會退而求其次只切換本機狀態,確保平板自己一定能進主畫面。

## NFC 路由(方案 A)

三端一律以卡片資料的 `data.id` 路由,`slot_index` 只代表物理 reader 位置。9 個家電 `id` 在三端之間**固定不可更動**:

```
door  ac  light  socket  curtain  sound  hrv  camera  sensor
```

| id      | 名稱   | id        | 名稱   |
| ------- | ------ | --------- | ------ |
| hrv     | 新風機 | sound     | 音響   |
| ac      | 冷氣   | light     | 燈     |
| curtain | 窗簾   | door      | 門     |
| socket  | 插座   | camera    | 攝影機 |
|         |        | sensor    | 感測器 |

## WS 訊息類型

server 推送 / 接受的 `type`:

- `reader-connected` / `reader-disconnected` — reader 上下線(帶 `slot_index`)
- `tag-present` / `tag-remove` — 卡片放上 / 拿走(帶 `slot_index`、`uid`、`known`、`data`)
- `session-start` / `session-end` — session 控制(任一端可送,server 廣播)

## 專案結構

```
src/
  App.jsx                  入口:組 StatusBar / GraphCanvas / DetailCard / WelcomeScreen,driving session 與重置鈕
  lib/useNfcSync.js        WS 客戶端 hook:維護 9 slot、聚合 activeIds、session 同步、sim 模式
  data/appliances.js       9 家電設定、座標、關聯邊、詳情資料(用電 / 累積 / 預測保養)
  components/
    GraphCanvas.jsx        知識圖譜:中樞光束、周邊卡片 + leader 線、全串聯 mesh 與完成浮層
    DetailCard.jsx         點節點 / 卡片彈出的家電詳情浮層
    StatusBar.jsx          頂部狀態列(連線、已連結數)
    WelcomeScreen.jsx      歡迎頁浮層(點擊進場)
  style.css                全站樣式
public/
  floorplan.svg            平面圖底圖(目前為佔位圖,待正式 render 替換)
```
