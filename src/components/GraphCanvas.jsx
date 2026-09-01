import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { APPLIANCES, APPLIANCE_BY_ID, EDGES } from '../data/appliances.js'

// AI 大腦中樞:落在平面圖中央偏下,所有 active 節點的光束往這裡匯聚。
const HUB = { x: 50, y: 50 }

// 周邊家電卡片佈局:依 x 把 9 台拆成左/右兩欄,各欄再依 y 由上而下均分排列。
// 卡片貼在平面圖左右內緣,leader 線從卡片錨點拉到圖上的節點座標。
function buildCardLayout() {
  const byX = [...APPLIANCES].sort((a, b) => a.pos.x - b.pos.x)
  const half = Math.ceil(byX.length / 2)
  // anchorX = 卡片「內緣」在平面圖寬度的 %(= CSS 的 left/right + 卡片寬),
  // leader 線端點精準落在卡片邊上。左欄 left:2% + width:13% → 內緣 15%;右欄對稱 85%。
  const cols = [
    { side: 'L', list: byX.slice(0, half), anchorX: 15 },
    { side: 'R', list: byX.slice(half), anchorX: 85 },
  ]
  const out = []
  for (const c of cols) {
    const list = [...c.list].sort((a, b) => a.pos.y - b.pos.y)
    const n = list.length
    list.forEach((a, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1)
      out.push({ a, side: c.side, anchorX: c.anchorX, cardY: 9 + t * 82 })
    })
  }
  return out
}

// 知識圖譜:節點依 activeIds 亮起,周邊卡片 + leader 線恆顯,
// 兩端皆 active 的邊連起來,全 active 時整圖串聯(allLinked)→ 全 mesh + 流動 + 完成浮層。
export default function GraphCanvas({ activeIds, allLinked, onPick }) {
  const cards = useMemo(buildCardLayout, [])

  // 兩端家電都在感應區的關聯邊。
  const liveEdges = useMemo(
    () => EDGES.filter((e) => activeIds.has(e.from) && activeIds.has(e.to)),
    [activeIds]
  )

  // 中樞光束:每個 active 節點 → HUB。
  const hubBeams = useMemo(
    () => APPLIANCES.filter((a) => activeIds.has(a.id)),
    [activeIds]
  )

  return (
    <div className="graph">
     <div className="graph__plan">
      <img className="graph__bg" src="/floorplan.svg" alt="" draggable="false" />

      <svg className="graph__edges" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* leader:周邊卡片 → 節點 */}
        {cards.map(({ a, anchorX, cardY }) => (
          <line
            key={`lead-${a.id}`}
            x1={anchorX} y1={cardY}
            x2={a.pos.x * 100} y2={a.pos.y * 100}
            className={`leader${activeIds.has(a.id) ? ' leader--active' : ''}`}
          />
        ))}

        {/* 中樞光束:active 節點 → HUB */}
        {hubBeams.map((a) => {
          const len = Math.hypot(a.pos.x * 100 - HUB.x, a.pos.y * 100 - HUB.y)
          return (
            <motion.line
              key={`hub-${a.id}`}
              x1={a.pos.x * 100} y1={a.pos.y * 100}
              x2={HUB.x} y2={HUB.y}
              className={`hub-beam${allLinked ? ' hub-beam--linked' : ''}`}
              strokeDasharray={len}
              initial={{ strokeDashoffset: len }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          )
        })}

        {/* 關聯邊:兩端皆 active */}
        {liveEdges.map((e) => {
          const a = APPLIANCE_BY_ID[e.from].pos
          const b = APPLIANCE_BY_ID[e.to].pos
          const x1 = a.x * 100, y1 = a.y * 100
          const x2 = b.x * 100, y2 = b.y * 100
          const len = Math.hypot(x2 - x1, y2 - y1)
          return (
            <g key={`${e.from}-${e.to}`}>
              <motion.line
                x1={x1} y1={y1} x2={x2} y2={y2}
                className="edge-core"
                strokeDasharray={len}
                initial={{ strokeDashoffset: len }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              />
            </g>
          )
        })}
      </svg>

      {/* 中央 AI 大腦中樞 */}
      <div
        className={`hub${activeIds.size > 0 ? ' hub--awake' : ''}${allLinked ? ' hub--linked' : ''}`}
        style={{ left: `${HUB.x}%`, top: `${HUB.y}%` }}
      >
        <span className="hub__core" />
        <span className="hub__label">AI<br />大腦</span>
      </div>

      {/* 節點(圖上發光點,名稱由周邊卡片承載)*/}
      {APPLIANCES.map((a) => {
        const isActive = activeIds.has(a.id)
        return (
          <button
            key={a.id}
            type="button"
            aria-label={a.label}
            className={'node' + (isActive ? ' node--active' : '') + (allLinked ? ' node--linked' : '')}
            style={{ left: `${a.pos.x * 100}%`, top: `${a.pos.y * 100}%` }}
            onClick={() => isActive && onPick(a.id)}
          >
            <span className="node__dot" />
          </button>
        )
      })}

      {/* 周邊家電卡片 */}
      {cards.map(({ a, side, cardY }) => {
        const isActive = activeIds.has(a.id)
        const d = a.detail
        return (
          <button
            key={`card-${a.id}`}
            type="button"
            className={`acard acard--${side.toLowerCase()}${isActive ? ' acard--active' : ''}`}
            style={{ top: `${cardY}%` }}
            onClick={() => isActive && onPick(a.id)}
          >
            <span className="acard__icon" />
            <span className="acard__body">
              <span className="acard__name">{a.label}</span>
              {isActive ? (
                <span className="acard__stat">
                  <em>{d.today.value}</em>
                  <i>{d.unit}</i>
                </span>
              ) : (
                <span className="acard__sub">{a.sub}</span>
              )}
            </span>
          </button>
        )
      })}

      {/* 完成浮層 */}
      {allLinked && (
        <motion.div
          className="complete"
          key="complete"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 1.8, ease: 'easeOut' }}
        >
          <div className="complete__inner">
            <div className="complete__kicker">ALL SYSTEMS LINKED</div>
            <h2 className="complete__title">全屋家電已串聯至 AI 大腦</h2>
            <p className="complete__sub">
              AI 正在學習你的生活方式,將自動調節出最舒適的居家情境。
            </p>
          </div>
        </motion.div>
      )}
     </div>
    </div>
  )
}
