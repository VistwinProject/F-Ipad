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
- framer-motion 11(只用於進出場:邊線繪入、卡片浮出)
- 原生 WebSocket(無額外 client 函式庫)

## 配色 / 設計 token

極簡黑灰白透明（樣本版），token 定義在 `src/style.css` 的 `:root`，三端共用同一組
名稱與數值（牆面因為是 JS 餵給 SVG，同一份在 `F-wall/src/config/theme.js`）。

| 用途 | token | 值 |
| --- | --- | --- |
| 背景 | `--c-bg` | `#000000` |
| hairline / idle 線 | `--c-border` | `rgba(255,255,255,0.10)` |
| 面板外框 / 節點 idle | `--c-border-2` | `rgba(255,255,255,0.22)` |
| active 白高光 | `--accent` | `rgba(255,255,255,0.85)` |
| 文字三階 | `--c-text` / `--c-text-mute` / `--c-text-dim` | `0.95` / `0.62` / `0.38` |

⚠ 變數名稱刻意沿用舊的（`--accent` 等），只換值，這樣元件不用改就跟著換皮。

狀態色（`--green` / `--amber` / `--red`）樣本階段一併走無彩：保養狀態靠
「即將到期」四個字 + 反白藥丸表達，連線狀態靠圓點實心 / 空心。要開回功能色，
改 `:root` 裡註解好的那三行。

⚠ `public/floorplan.svg` 是用 `<img>` 載入的，外部 CSS 打不到它，配色寫在
SVG 檔案內的 `<defs><style>`。要改平面圖顏色請改那個檔，不是 `style.css`。

字體：Latin / 數字走系統字並開 `tabular-nums`；CJK 用 Chiron Hei HK（CDN），
離線時退到 `PingFang TC` / 微軟正黑體。

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
hrv  ac  dehum  purifier  sensor  light  socket  curtain  bathfan
```

| id       | 名稱         | id      | 名稱       |
| -------- | ------------ | ------- | ---------- |
| hrv      | 新風機       | light   | 燈         |
| ac       | 冷氣         | socket  | 智慧插座   |
| dehum    | 除濕機       | curtain | 窗簾       |
| purifier | 空氣清淨機   | bathfan | 浴室暖風機 |
| sensor   | 12合一感測器 |         |            |

> `?sim=1` 的鍵盤 `1`–`9` 依上表由左而右、由上而下對應
> （`1`=新風機、`2`=冷氣、`3`=除濕機 …… `9`=浴室暖風機），順序定義在
> `src/lib/useNfcSync.js` 的 `SIM_IDS`。

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
    GraphCanvas.jsx        知識圖譜:平面圖底圖、9 節點、中樞、周邊卡片 + leader 線、真實關聯邊與完成浮層
    DetailCard.jsx         點節點 / 卡片彈出的家電詳情浮層
    StatusBar.jsx          頂部狀態列(連線、已連結數)
    WelcomeScreen.jsx      歡迎頁浮層(點擊進場)
  style.css                全站樣式
public/
  floorplan.svg            平面圖底圖(目前為佔位圖,待正式 render 替換)
```

---

## 三端共用的視覺程式碼（重要）

`src/glow/`（WebGL 發光層）與 `src/shared/` 這兩個資料夾是**從 F-wall 複製過來的**，
不是這個 repo 自己維護的。`src/style.css` 裡 `GLOW-TOKENS:BEGIN … END` 之間的
CSS 變數也是產生出來的。

⚠ **不要直接改這些檔案** —— 下次同步會被蓋掉。要改就改 F-wall：

| 要改什麼 | 改哪裡 |
| --- | --- |
| 顏色、毛玻璃、彗星參數 | `F-wall/src/config/fx.js` 的 `SHARED` |
| shader / bloom / 發光層邏輯 | `F-wall/src/glow/` |

改完到 F-wall 跑同步：

```bash
cd ../F-wall        # 三個專案要並排放
node sync-tokens.mjs
```

這樣做（複製而不是 import / submodule）是為了讓每個資料夾都自帶完整程式碼 ——
單獨複製到展場電腦就能跑，不依賴其他 repo 存在。展場現場不需要跑同步腳本。
