import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { APPLIANCES, APPLIANCE_BY_ID, EDGES } from '../data/appliances.js'
import GlowLayer from '../glow/GlowLayer.jsx'
import { circlePoints } from '../glow/ribbon.js'
import GraphTuner from './GraphTuner.jsx'
import { isTuned, loadTuning, saveTuning } from '../lib/graphTuning.js'

// AI 大腦中樞:所有 active 節點的光束往這裡匯聚。
// ⚠ 座標是 .graph__plan 的 %,要跟 public/TOP.png 的隔間對齊 ——
//   擺在【客廳下緣中央】(viewBox 約 540,299)。平面圖的幾何正中心 (50,50) 會落在
//   客房/更衣間的牆角上,看起來像沒對齊,所以不用那裡。平面圖換版時這裡要重新對。
const HUB = { x: 51.436, y: 51.035 }

// 周邊家電卡片佈局:依 x 把 9 台拆成左/右兩欄,各欄再依 y 由上而下均分排列。
// 卡片貼在平面圖左右內緣,leader 線從卡片錨點拉到圖上的節點座標。
function buildCardLayout(posOf = (a) => a.pos) {
  const byX = [...APPLIANCES].sort((a, b) => posOf(a).x - posOf(b).x)
  const half = Math.ceil(byX.length / 2)
  // anchorX = 卡片「內緣」在平面圖寬度的 %(= CSS 的 left/right + 卡片寬),
  // leader 線端點精準落在卡片邊上。左欄 left:2% + width:13% → 內緣 15%;右欄對稱 85%。
  const cols = [
    { side: 'L', list: byX.slice(0, half), anchorX: 15 },
    { side: 'R', list: byX.slice(half), anchorX: 85 },
  ]
  const out = []
  for (const c of cols) {
    const list = [...c.list].sort((a, b) => posOf(a).y - posOf(b).y)
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
  const planRef = useRef(null)

  // ── 調參面板（鍵盤 e）─────────────────────────────────────────────────────
  // ⚠ 暫時性工具。展場的 iPad 沒有實體鍵盤,所以按鍵開啟不會誤觸。
  //   覆寫值存在 localStorage,調完要按「匯出」貼回程式碼(見 lib/graphTuning.js)。
  const [tuner, setTuner] = useState(false)
  const [tune, setTune] = useState(loadTuning)
  useEffect(() => saveTuning(tune), [tune])
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const t = e.target
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (e.key === 'e' || e.key === 'E') setTuner((v) => !v)
      if (e.key === 'Escape') setTuner(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 覆寫過的座標優先,沒動過的用 appliances.js 的原值。
  const posOf = useCallback((a) => tune.nodes[a.id] ?? a.pos, [tune.nodes])
  const hub = tune.hub ? { x: tune.hub.x * 100, y: tune.hub.y * 100 } : HUB

  const cards = useMemo(() => buildCardLayout(posOf), [posOf])

  // ── 發光層 ──────────────────────────────────────────────────────────────
  // 要亮的東西:active 節點的外圈與它到中樞的光束、兩端皆 active 的關聯邊、
  // 有任何一台時的中樞環。⚠ 場景是【一次建好全部】再用 id 控制明暗
  //   (與牆面同一個作法),所以這裡只給「哪些 id 要亮」。
  const activeKey = APPLIANCES.map((a) => (activeIds.has(a.id) ? 1 : 0)).join('')
  const glowActive = useMemo(() => {
    const ids = new Set()
    for (const a of APPLIANCES) {
      if (!activeIds.has(a.id)) continue
      ids.add(`beam-${a.id}`)
      ids.add(`ring-${a.id}`)
    }
    for (const e of EDGES) {
      if (activeIds.has(e.from) && activeIds.has(e.to)) ids.add(`edge-${e.from}-${e.to}`)
    }
    if (activeIds.size > 0) ids.add('hub')
    return ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey])

  // 幾何。⚠ 這裡的 % → 世界座標換算必須與 CSS 的節點/中樞定位一致
  //   (.node 用 a.pos 的 %、.hub 用 HUB 的 %),否則光會跟白點錯開。
  const buildGlow = useCallback((world, px) => {
    const W = (v) => (v / 100) * world.w
    const H = (v) => (v / 100) * world.h
    const s = world.w / (px.width || world.w) // CSS px → 世界單位
    const hubP = { x: W(hub.x), y: H(hub.y) }
    const at = (a) => ({ x: W(posOf(a).x * 100), y: H(posOf(a).y * 100) })

    const beams = []
    const lines = []
    // 光束到中樞【環的外緣】就停,不要畫進環裡。
    // ⚠ 與牆面同一個作法:牆面的走線也是切在核心黑塊的邊緣,不伸進去 ——
    //   伸進去的話彗星會在環內側爆一團光,而且環本身的亮芯會被線壓掉。
    //   退的距離就是中樞環半徑(tune.hubR),要留縫就在這裡加幾 px。
    const hubClear = (from) => {
      const dx = hubP.x - from.x
      const dy = hubP.y - from.y
      const d = Math.hypot(dx, dy) || 1
      // 節點萬一被拖進環裡,夾住才不會讓端點翻到節點的另一側
      const back = Math.min(tune.hubR * s, d * 0.9)
      return { x: hubP.x - (dx / d) * back, y: hubP.y - (dy / d) * back }
    }

    for (const a of APPLIANCES) {
      const p = at(a)
      // ⚠ 順序＝流動方向:家電 → 中樞,與牆面的走線同向(資料流進 AI 大腦)。
      beams.push({ id: `beam-${a.id}`, pts: [p, hubClear(p)], width: tune.beamWidth, minCorePx: tune.minCorePx })
      // 節點外圈:貼在 .node__dot 外面一圈(預設白點 20px、環半徑 11px)。
      lines.push({ id: `ring-${a.id}`, pts: circlePoints(p.x, p.y, tune.ringR * s), closed: true, width: tune.lineWidth, minCorePx: tune.minCorePx })
    }
    // 關聯邊:兩端皆 active 時亮起。沒有彗星 —— 那是「關係」不是「資料流」。
    // ⚠ minCorePx 對這幾條最要緊:它們是【任意角度】的直線,亮芯不夠寬時
    //   bloom 會被亞像素對位切成一節一節(見 glow/shaders.js 的 ridge())。
    for (const e of EDGES) {
      lines.push({
        id: `edge-${e.from}-${e.to}`,
        pts: [at(APPLIANCE_BY_ID[e.from]), at(APPLIANCE_BY_ID[e.to])],
        width: tune.lineWidth,
        minCorePx: tune.minCorePx,
      })
    }
    // 中樞環:與 .hub__core 那圈 hairline 疊在一起(預設 46px → 半徑 23)。
    lines.push({ id: 'hub', pts: circlePoints(hubP.x, hubP.y, tune.hubR * s), closed: true, width: tune.lineWidth, minCorePx: tune.minCorePx })
    return { lines, beams }
  }, [hub, posOf, tune.beamWidth, tune.lineWidth, tune.ringR, tune.hubR, tune.minCorePx])

  // 幾何是烤進 ribbon 頂點的,調參之後要讓發光層重建場景 —— 見 GlowLayer 的 rebuildKey。
  const glowKey = useMemo(
    () => [tune.lineWidth, tune.beamWidth, tune.ringR, tune.hubR, tune.minCorePx, hub.x, hub.y,
           APPLIANCES.map((a) => `${posOf(a).x},${posOf(a).y}`).join('|')].join(';'),
    [tune.lineWidth, tune.beamWidth, tune.ringR, tune.hubR, tune.minCorePx, hub, posOf]
  )

  return (
    <div className="graph">
     <div
      className={`graph__plan${tuner ? ' graph__plan--tuning' : ''}`}
      ref={planRef}
      style={{ '--node-dot': `${tune.dotSize}px`, '--node-dot-idle': `${tune.dotSize - 2}px` }}
     >
      {/* 發光層:牆面那套 WebGL + UnrealBloomPass,畫節點外圈、中樞環、
          關聯邊與「家電 → 中樞」的光束＋彗星拖尾。
          ⚠ 疊在最底層,平面圖、連線 SVG、白點、卡片全部在它之上 ——
             canvas 只負責「光」,銳利的東西不要進來(與牆面同一個分層原則)。 */}
      <GlowLayer
        containerRef={planRef}
        build={buildGlow}
        activeIds={glowActive}
        rebuildKey={glowKey}
        className="glow-layer"
      />
      {/* 俯視渲染圖。⚠ 疊在【最底層】(z-index 0),發光層在它之上 ——
          換成實拍/渲染圖之後如果沿用舊的層級(圖在上、canvas 在下),
          那張不透明的圖會把整層光蓋掉。 */}
      <img className="graph__bg" src="/TOP.png" alt="" draggable="false" />

      <svg className="graph__edges" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* leader:周邊卡片 → 節點 */}
        {cards.map(({ a, anchorX, cardY }) => (
          <line
            key={`lead-${a.id}`}
            x1={anchorX} y1={cardY}
            x2={posOf(a).x * 100} y2={posOf(a).y * 100}
            className={`leader${activeIds.has(a.id) ? ' leader--active' : ''}`}
          />
        ))}

        {/* ⚠ 中樞光束與關聯邊已經搬到 WebGL 發光層 —— 亮芯、光暈、彗星拖尾、
            底光呼吸,連「射向中樞」的 draw-in(shader 的 uProgress)都在那裡。
            這張 SVG 現在只剩 leader:卡片 → 節點的細連接線,那不是「光」。 */}
      </svg>

      {/* 中央 AI 大腦中樞 */}
      <div
        className={`hub${activeIds.size > 0 ? ' hub--awake' : ''}${allLinked ? ' hub--linked' : ''}`}
        style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
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
            style={{ left: `${posOf(a).x * 100}%`, top: `${posOf(a).y * 100}%` }}
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

      {/* 調參面板（鍵盤 e）與拖曳把手 */}
      {tuner && (
        <GraphTuner
          tune={tune}
          setTune={setTune}
          planRef={planRef}
          hub={hub}
          onClose={() => setTuner(false)}
        />
      )}
      {/* 有覆寫值但面板關著時的提示 —— 不然很容易忘記畫面上不是程式碼裡的值 */}
      {!tuner && isTuned(tune) && (
        <div className="tuner-badge">⚙ 已套用編輯值（按 e 開啟面板）</div>
      )}

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
