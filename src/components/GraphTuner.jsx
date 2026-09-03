import { useCallback, useEffect, useRef } from 'react'
import { APPLIANCES } from '../data/appliances.js'
import { DEFAULTS, clearTuning, exportTuning } from '../lib/graphTuning.js'

// ============================================================================
// 鍵盤 e —— 知識圖譜的即時調參面板（暫時性工具，不是展場的一部分）
//
// 能調：發光線粗細（外圈／光束分開）、節點外圈與中樞環半徑、節點白點大小，
//       以及直接在平面圖上拖曳節點與中樞。
//
// ⚠ 展場的 iPad 沒有實體鍵盤，所以用按鍵開啟是安全的 —— 觸控不會誤觸。
// ⚠ 調完按「匯出」，把內容貼回程式碼（各項對應到哪個檔案，匯出的文字裡有寫）。
//    localStorage 只是過程的暫存。
// ============================================================================

// [key, 標籤, 最小, 最大, 每步, 顯示用的換算]
const SLIDERS = [
  ['lineWidth', '外圈／關聯邊 線粗', 0.002, 0.04, 0.0005, (v) => `${Math.round(v * 1920 * 10) / 10} (牆面單位)`],
  ['beamWidth', '中樞光束 線粗', 0.002, 0.04, 0.0005, (v) => `${Math.round(v * 1920 * 10) / 10} (牆面單位)`],
  ['ringR', '節點外圈半徑', 4, 40, 1, (v) => `${v} px`],
  ['hubR', '中樞環半徑', 8, 80, 1, (v) => `${v} px`],
  ['dotSize', '節點白點直徑', 6, 40, 1, (v) => `${v} px`],
]

export default function GraphTuner({ tune, setTune, planRef, hub, onClose }) {
  // 拖曳：把螢幕座標換成 .graph__plan 的 0..1
  const drag = useRef(null)
  const toFrac = useCallback((e) => {
    const r = planRef.current?.getBoundingClientRect()
    if (!r) return null
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    }
  }, [planRef])

  useEffect(() => {
    const onMove = (e) => {
      if (!drag.current) return
      const p = toFrac(e)
      if (!p) return
      const { id } = drag.current
      setTune((t) => (id === '__hub'
        ? { ...t, hub: p }
        : { ...t, nodes: { ...t.nodes, [id]: p } }))
    }
    const onUp = () => { drag.current = null }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [setTune, toFrac])

  const startDrag = (id) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    drag.current = { id }
  }

  const set = (k) => (e) => setTune((t) => ({ ...t, [k]: parseFloat(e.target.value) }))

  const doExport = async () => {
    const text = exportTuning(tune, hub)
    try {
      await navigator.clipboard.writeText(text)
      alert('已複製到剪貼簿：\n\n' + text)
    } catch {
      // 沒有剪貼簿權限（非 https / 非使用者手勢）時退回主控台
      console.log(text)
      alert('剪貼簿不可用，內容已印在主控台（F12）：\n\n' + text)
    }
  }

  const doReset = () => {
    clearTuning()
    setTune({ ...DEFAULTS, nodes: {} })
  }

  return (
    <>
      {/* 拖曳把手：疊在節點與中樞上。只有面板開著時存在。 */}
      <div className="tuner-handles">
        {APPLIANCES.map((a) => {
          const p = tune.nodes[a.id] ?? a.pos
          return (
            <button
              key={a.id}
              type="button"
              className="tuner-grip"
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
              onPointerDown={startDrag(a.id)}
              title={`${a.label}　拖曳移動`}
            >
              <span>{a.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          className="tuner-grip tuner-grip--hub"
          style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
          onPointerDown={startDrag('__hub')}
          title="AI 大腦中樞　拖曳移動"
        >
          <span>中樞</span>
        </button>
      </div>

      <div className="tuner" onPointerDown={(e) => e.stopPropagation()}>
        <div className="tuner__head">
          <strong>圖譜調參</strong>
          <span className="tuner__hint">e 關閉</span>
          <button type="button" className="tuner__x" onClick={onClose} aria-label="關閉">×</button>
        </div>

        {SLIDERS.map(([k, label, min, max, step, fmt]) => (
          <label key={k} className="tuner__row">
            <span className="tuner__label">{label}</span>
            <input type="range" min={min} max={max} step={step} value={tune[k]} onChange={set(k)} />
            <span className="tuner__val">{fmt(tune[k])}</span>
          </label>
        ))}

        <p className="tuner__note">
          平面圖上的圓點可以直接拖曳（九台家電 + 中樞）。
        </p>

        <div className="tuner__foot">
          <button type="button" onClick={doExport}>匯出（複製）</button>
          <button type="button" onClick={doReset}>重設</button>
        </div>
      </div>
    </>
  )
}
