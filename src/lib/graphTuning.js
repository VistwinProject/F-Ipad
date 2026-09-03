import { APPLIANCES } from '../data/appliances.js'
import { PARAMS } from '../glow/params.js'

// ============================================================================
// 知識圖譜的即時調參 —— 只給編輯面板（鍵盤 e）用的暫時性資料層。
//
// 存在 localStorage，重整不會掉。調完按「匯出」，把內容貼回程式碼：
//   線粗細 → F-wall/src/config/fx.js 的 FX.frame.width / FX.beam.width
//            （改完要跑 `node sync-tokens.mjs`，三端一起變）
//   節點位置 → F-Ipad/src/data/appliances.js 的 pos
//   中樞位置 → F-Ipad/src/components/GraphCanvas.jsx 的 HUB
//   其餘尺寸 → GraphCanvas.jsx 的 buildGlow / style.css
//
// ⚠ localStorage 只是調整過程的暫存，不是設定檔。沒寫回程式碼的話，
//    換一台機器、換一個瀏覽器就沒了。畫面左下角會顯示「已套用編輯值」提醒。
// ============================================================================

const KEY = 'f-ipad-graph-tuning'

// 預設值＝目前程式碼裡的值。面板的「重設」會回到這裡。
// ⚠ 這裡就是 iPad 這一端的【真正設定值】—— GraphCanvas 沒有另外寫死，
//   它一律讀 { ...DEFAULTS, ...localStorage }。要改就改這裡。
export const DEFAULTS = {
  // ⚠ 線粗【刻意不跟 PARAMS 走】。PARAMS.line/beam.width 是 fx.js 的 SHARED，
  //   三端共用；iPad 的圖譜線比牆面的格線細很多才好看（這是實際調出來的），
  //   所以這一端自己拿一組值。代價是：之後改 SHARED 的線粗不會連動到 iPad，
  //   要一起改就改這兩行。（原本是 PARAMS.line.width / PARAMS.beam.width＝0.013542）
  lineWidth: 0.008,               // 節點外圈／關聯邊的線粗（世界寬比例）
  beamWidth: 0.011,               // 家電 → 中樞 的光束線粗（世界寬比例）
  // 亮芯的最小像素寬。⚠ 這是 iPad 專屬的：牆面與桌面不帶（＝ 1.0）。
  //   線細到亮芯不足 2px，又是【任意角度】時，bloom 的峰值門檻會被亞像素對位
  //   打成一節一節的光暈 —— 近水平的四條邊（sensor–ac 0.5°、socket–dehum 4.3°、
  //   light–curtain 10°、sensor–hrv 10.4°）最明顯。牆面的格線是水平垂直的，
  //   沿線相位不變，所以牆面沒有這個症狀。完整推導在 glow/shaders.js 的 ridge()。
  //   2.0 是實測掃出來的：1.0 時光暈起伏 0.85，1.5 掉到 0.28，2.0 是 0.22（最低），
  //   再往上只會讓線變粗變亮。代價是亮帶從 3.7px 變成 7.8px、光暈亮度約 2 倍 ——
  //   在現場的 iPad 上覺得太胖就用面板（鍵盤 e）往 1.5 調，症狀一樣是治好的。
  minCorePx: 2.0,
  ringR: 6,                       // 節點外圈半徑（px）
  hubR: 35,                       // 中樞環半徑（px）。⚠ 光束的終點也退這個距離（見 GraphCanvas 的 hubClear）
  dotSize: 6,                     // 節點白點直徑（px，active）
  hub: null,                      // null = 用程式碼裡的 HUB
  nodes: {},                      // { [id]: { x, y } } 0..1，只存有搬過的
}

export function loadTuning() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveTuning(t) {
  try { localStorage.setItem(KEY, JSON.stringify(t)) } catch { /* 無痕模式會失敗，不影響使用 */ }
}

export function clearTuning() {
  try { localStorage.removeItem(KEY) } catch { /* 同上 */ }
}

/** 有沒有任何一項跟預設不同 —— 決定要不要顯示「已套用編輯值」。 */
export function isTuned(t) {
  if (!t) return false
  if (t.hub) return true
  if (Object.keys(t.nodes || {}).length) return true
  return ['lineWidth', 'beamWidth', 'ringR', 'hubR', 'dotSize', 'minCorePx']
    .some((k) => Math.abs(t[k] - DEFAULTS[k]) > 1e-9)
}

const r4 = (n) => Math.round(n * 10000) / 10000
const r3 = (n) => Math.round(n * 1000) / 1000

/** 匯出成可以直接貼回程式碼的形式。 */
export function exportTuning(t, HUB) {
  const L = []
  L.push('// ── 由 iPad 的編輯面板（鍵盤 e）匯出 ──')
  L.push('')

  const wChanged = Math.abs(t.lineWidth - DEFAULTS.lineWidth) > 1e-9
    || Math.abs(t.beamWidth - DEFAULTS.beamWidth) > 1e-9
  if (wChanged) {
    // fx.js 是三端共用的來源，那邊的單位是牆面 viewBox 1920 的世界單位。
    L.push('// 1) 線粗細 → F-wall/src/config/fx.js（改完跑 node sync-tokens.mjs，三端一起變）')
    L.push(`//    FX.frame.width = ${r3(t.lineWidth * 1920)}   // 目前 ${r3(DEFAULTS.lineWidth * 1920)}`)
    L.push(`//    FX.beam.width  = ${r3(t.beamWidth * 1920)}   // 目前 ${r3(DEFAULTS.beamWidth * 1920)}`)
    L.push('//    ⚠ 這會同時改變牆面與桌面的線粗 —— 那正是「三端統一」的意思。')
    L.push('//      只想動 iPad 的話改 buildGlow 裡的 width，但三端就會分家。')
    L.push('')
  }

  if (Math.abs(t.minCorePx - DEFAULTS.minCorePx) > 1e-9) {
    L.push('// 1b) 亮芯最小像素寬 → F-Ipad/src/lib/graphTuning.js 的 DEFAULTS')
    L.push(`//    minCorePx: ${r3(t.minCorePx)},   // 目前 ${DEFAULTS.minCorePx}`)
    L.push('//    ⚠ 只影響 iPad。太小＝光暈一節一節，太大＝線糊掉。')
    L.push('')
  }

  const sizeChanged = ['ringR', 'hubR', 'dotSize'].some((k) => t[k] !== DEFAULTS[k])
  if (sizeChanged) {
    L.push('// 2) 尺寸 → F-Ipad/src/components/GraphCanvas.jsx 的 buildGlow')
    L.push(`//    節點外圈半徑  circlePoints(p.x, p.y, ${t.ringR} * s)`)
    L.push(`//    中樞環半徑    circlePoints(hub.x, hub.y, ${t.hubR} * s)`)
    L.push('//    節點白點 → F-Ipad/src/style.css 的 .node--active .node__dot')
    L.push(`//    width: ${t.dotSize}px; height: ${t.dotSize}px;   （idle 版是 ${t.dotSize - 2}px）`)
    L.push('')
  }

  if (t.hub) {
    L.push('// 3) 中樞位置 → F-Ipad/src/components/GraphCanvas.jsx')
    L.push(`const HUB = { x: ${r3(t.hub.x * 100)}, y: ${r3(t.hub.y * 100)} }`)
    L.push('')
  }

  const moved = Object.keys(t.nodes || {})
  if (moved.length) {
    L.push(`// 4) 節點位置 → F-Ipad/src/data/appliances.js（${moved.length} 台有搬動）`)
    for (const a of APPLIANCES) {
      const p = t.nodes[a.id]
      if (!p) continue
      L.push(`//    ${a.label}（${a.id}）`)
      L.push(`    pos: { x: ${r4(p.x)}, y: ${r4(p.y)} },`)
    }
    L.push('')
    L.push('// ⚠ 平面圖換版時這些座標要重新對 —— 它們是 public/TOP.png 上的相對位置。')
  }

  if (L.length <= 2) L.push('// （沒有任何改動）')
  return L.join('\n')
}
