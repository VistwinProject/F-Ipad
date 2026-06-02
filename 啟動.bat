@echo off
chcp 65001 >nul
title AI 大腦控制塔 - 啟動器
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     AI 大腦控制塔  F 區平板介面     ║
echo  ╚══════════════════════════════════════╝
echo.

:: ── 1. 確認 Node.js 已安裝 ──────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
  echo  [錯誤] 找不到 Node.js！
  echo.
  echo  請先到 https://nodejs.org/ 下載安裝 LTS 版本，
  echo  安裝完成後重新執行此批次檔。
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER%

:: ── 2. 首次執行自動安裝套件 ─────────────────────────────────────────────────
if not exist "node_modules\" (
  echo  [安裝] 首次執行，安裝相依套件中，請稍等...
  echo.
  npm install
  if errorlevel 1 (
    echo.
    echo  [錯誤] npm install 失敗，請確認網路連線後重試。
    pause
    exit /b 1
  )
  echo.
  echo  [OK] 套件安裝完成
)

:: ── 3. 啟動 Vite 開發伺服器（在獨立視窗背景跑）────────────────────────────
echo  [啟動] 啟動開發伺服器 (port 5175)...
start "F-Ipad  |  按 Ctrl+C 停止伺服器" cmd /k "npm run dev"

:: ── 4. 等 Vite 就緒（一般 2-3 秒）──────────────────────────────────────────
echo  [等待] 伺服器初始化中...
timeout /t 4 /nobreak >nul

:: ── 5. 開啟瀏覽器（預設模擬模式，可改成不帶 ?sim=1 的正式網址）────────────
echo  [開啟] 瀏覽器 → http://localhost:5175/?sim=1
start "" "http://localhost:5175/?sim=1"

echo.
echo  ══════════════════════════════════════════════
echo   伺服器在另一個視窗背景執行中。
echo   要「停止」伺服器：關閉標題含「F-Ipad」的 CMD 視窗。
echo   要「開啟正式網址（不模擬）」：瀏覽器改開
echo     http://localhost:5175/
echo  ══════════════════════════════════════════════
echo.
pause
