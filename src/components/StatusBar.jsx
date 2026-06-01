import { APPLIANCE_COUNT } from '../data/appliances.js'

const LABEL = {
  connected: '已連線',
  connecting: '連線中',
  disconnected: '離線',
}

export default function StatusBar({ status, placed, total, connectedReaders, allLinked }) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__zone">F</span>
        <span className="topbar__title">AI 大腦控制塔</span>
      </div>

      <div className="topbar__meta">
        {allLinked && <span className="topbar__linked">全屋連動完成</span>}
        <span className="topbar__count">
          已放置 <strong>{placed}</strong> / {total}
        </span>
        <span className={`topbar__ws topbar__ws--${status}`}>
          <i />
          {LABEL[status] || status}
        </span>
      </div>
    </header>
  )
}
