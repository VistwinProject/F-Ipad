# F-Ipad / zone-audio 工作計畫

建立／修改：2026-10-25。**目前只建立規格與計畫，功能未實作、未驗收、未部署。**

區域：F；工作分支：`codex/zone-audio-v1-20261025`。
本輪核對 main：`62d640d7678fa6611b03c28973955f886e2a40bd`。這不是當日現場已確認版本。

## 來源與修改範圍

- 定位：F2.0/src/ 的 iPad 角色、server/x-f-adapter.mjs、共用音訊來源。
- 證據：iPad completion 路徑只送 completion-play；實際 completion 音源是 Table。
- 先解決：核對現場 iPad 與 Table 角色，不能用 iPad 系統音量代替 Table 音量。
- 音量工作：加本區音量 UI，使用區域權威狀態；共用修改與 F-table/F-wall 同批，保持 NFC／reset。

## 本分支只交付統一音量

使用共同 audio.v1，不各自發明 slider 百分比／mute／ack 行為；先盤點真正音源再動程式。通過 A1–A10 與區域回歸；A8–A10 到場驗收前不得宣稱現場完成。合併先依賴 X 的 audio.v1 相容支援；E 另依賴 E／X 相容整合；F 三 repo 為同一發布批次。

## 交付證據

- 修改清單與完整 commit、當日現場來源差異、共同契約版本／SHA。
- offline 測試名稱、執行結果與限制；不能把本次文件檢查算成功能測試。
- sourceId／音源／裝置對照、X 相容 commit、部署入口與受控設定備份引用。
- 到場維護時段、實際聲光／螢幕驗收及回退結果，未執行維持 null。

詳細標準與 merge／部署順序：[共同標準](STANDARD.md)。
