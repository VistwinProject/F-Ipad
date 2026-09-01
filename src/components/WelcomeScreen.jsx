import { useState } from 'react'

// 歡迎頁 — 蓋在主畫面上的全螢幕浮層。使用者點擊任意處 → 淡出 → 露出底下主畫面。
// 與桌面端 (vibenfc/nfc-web-control) 同一套視覺與行為。
// 正式環境可改由 WS「開始 session」訊息觸發;目前用點擊 / 鍵盤啟動。
export default function WelcomeScreen({ onStart }) {
  const [exiting, setExiting] = useState(false)

  const trigger = () => {
    if (exiting) return
    setExiting(true)
    setTimeout(onStart, 600) // 等淡出動畫結束再卸載(對齊 CSS 600ms)
  }

  return (
    <div
      className={`welcome-screen${exiting ? ' welcome-screen--exit' : ''}`}
      onClick={trigger}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') trigger() }}
      role="button"
      tabIndex={0}
    >
      <div className="welcome-screen__content">
        <div className="welcome-screen__greeting">歡 迎 來 到</div>
        <h1 className="welcome-screen__title">
          <span className="welcome-screen__brace">「</span>
          AI 大腦控制塔
          <span className="welcome-screen__brace">」</span>
        </h1>
        <p className="welcome-screen__instruction">
          請拿取前方設備裝置,放置相對的感應範圍,<br />
          開始將居家設備連結到 AI 大腦!
        </p>
        <div className="welcome-screen__cta">點擊任意位置開始</div>
      </div>
    </div>
  )
}
