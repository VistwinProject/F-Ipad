import { motion } from 'framer-motion'
import { APPLIANCE_BY_ID } from '../data/appliances.js'

// 點選圖上 / 卡片上的已亮起家電 → 浮出詳細數據卡(可關閉)。
// 用 key 觸發重新掛載 → 每次切換家電播放一次 enter 動畫。
// 不用 AnimatePresence exit(此環境 exit 不會完成,會卡住舊卡片)。
export default function DetailCard({ focusedId, onClose }) {
  const appliance = focusedId ? APPLIANCE_BY_ID[focusedId] : null
  if (!appliance) return null

  return (
    <div className="detail-overlay" onClick={onClose}>
      <motion.div
        key={appliance.id}
        className="detail__card"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <button type="button" className="detail__close" onClick={onClose} aria-label="關閉">×</button>
        <DetailBody appliance={appliance} />
      </motion.div>
    </div>
  )
}

function DetailBody({ appliance }) {
  const d = appliance.detail
  const sign = d.today.deltaPct < 0 ? '↓' : d.today.deltaPct > 0 ? '↑' : '·'
  const monthPct = Math.min(100, Math.round((d.month.value / d.month.target) * 100))

  return (
    <>
      <h2 className="detail__title">
        {appliance.label}
        <span className="detail__sub">{appliance.sub}</span>
      </h2>

      <section className="dcard">
        <div className="dcard__label">{d.today.label}</div>
        <div className="stat">
          <span className="stat__value">{d.today.value}</span>
          <span className="stat__unit">{d.unit}</span>
          <span className={`stat__delta is-${d.today.deltaColor}`}>
            {sign} {Math.abs(d.today.deltaPct)}% <em>較昨日</em>
          </span>
        </div>
      </section>

      <section className="dcard">
        <div className="dcard__label">{d.month.label}</div>
        <div className="cumul">
          <div className="cumul__head">
            <span className="stat__value stat__value--sm">{d.month.value}</span>
            <span className="stat__unit">{d.unit}</span>
            <span className="cumul__target">目標 {d.month.target.toLocaleString()} {d.unit}</span>
          </div>
          <div className="cumul__bar"><div className="cumul__fill" style={{ width: `${monthPct}%` }} /></div>
          <div className="cumul__meta"><span>目標達成率</span><span className="cumul__pct">{monthPct}%</span></div>
        </div>
      </section>

      <section className="dcard">
        <div className="dcard__label">預測性維護</div>
        <div className="maint">
          {d.maint.map((m) => (
            <div key={m.id} className="maint__row">
              <span className="maint__name">{m.name}</span>
              <span className="maint__date">{m.next}</span>
              <span className={`maint__status maint__status--${m.status}`}>{m.label}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
