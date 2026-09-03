import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { attachSimKeys } from '../shared/simKeys.js'

// ── WS endpoint ───────────────────────────────────────────────────────────────
// 依 F 區 SYNC-SPEC：WS server 固定 listen :8787,跑在「接 NFC reader 的那台 PC」。
// 用 location.hostname 自動推導,讓同一份程式碼兩種裝置都能用:
//   • 在 PC 上測試      → 開 http://localhost:5175  → hostname=localhost → ws://localhost:8787
//   • 在 iPad 上展演    → 開 http://<PC的IP>:5175    → hostname=PC IP    → ws://<PC的IP>:8787
// （?ws=host 可手動覆寫,debug 用）
function resolveWsUrl() {
  const override = new URLSearchParams(location.search).get('ws')
  const host = override || location.hostname || 'localhost'
  return `ws://${host}:8787`
}

const WS_URL = resolveWsUrl()
const RECONNECT_MS = 3000
const SLOT_COUNT = 9

// ⚠ 鍵盤模擬 NFC 不在這裡。舊版在這個檔案裡自己造假狀態（?sim=1）,
//   但那樣【只有平板會亮】,看不出三端同步 —— 而三端同步正是要驗的東西。
//   現在鍵盤只是把按鍵送給 server（見 shared/simKeys.js）,由 server 走跟
//   真實讀卡機完全相同的那條路廣播出去。開關在 server：npm run sim。
//   九台的順序（鍵盤 1–9 的對應）也移到 server 的 SIM_IDS。

const emptySlot = () => ({ connected: false, readerName: '', activeCard: null })

/**
 * 連 F 區 NFC WS server,維護 9 個 slot 的狀態,並導出以「家電 id」為單位的視圖。
 * 三端用 data.id 路由(方案 A),slot_index 只代表物理 reader。
 */
export function useNfcSync() {
  const [status, setStatus] = useState('connecting') // connecting | connected | disconnected
  const [slots, setSlots] = useState(() => Array.from({ length: SLOT_COUNT }, emptySlot))
  const [focusedId, setFocusedId] = useState(null) // 最後刷的家電 id(奪焦)
  const [sessionMode, setSessionMode] = useState('welcome') // welcome | live(由 WS session-start/-end 同步)

  const wsRef = useRef(null)
  const timerRef = useRef(null)

  const patchSlot = useCallback((i, patch) => {
    setSlots((prev) => {
      if (i == null || i < 0 || i >= prev.length) return prev
      const next = [...prev]
      next[i] = { ...next[i], ...patch }
      return next
    })
  }, [])

  const handleMessage = useCallback((msg) => {
    const i = msg.slot_index
    switch (msg.type) {
      case 'reader-connected':
        patchSlot(i, { connected: true, readerName: msg.reader })
        break
      case 'reader-disconnected':
        patchSlot(i, { connected: false, readerName: '', activeCard: null })
        break
      case 'tag-present':
        patchSlot(i, { activeCard: { uid: msg.uid, known: msg.known, data: msg.data } })
        if (msg.known && msg.data?.id) setFocusedId(msg.data.id)
        break
      case 'tag-remove':
        // 拿走的若是目前焦點 → 由下方 effect fallback 到剩下 active 的最新者
        patchSlot(i, { activeCard: null })
        break
      // ── Session 控制(由任一端廣播,server 轉發給所有客戶端)──
      // 平板點歡迎頁送 session-start → 三端同時離開歡迎頁;新連上的客戶端也會收到當前狀態。
      case 'session-start':
        setSessionMode('live')
        break
      case 'session-end':
        setSessionMode('welcome')
        break
      default:
        break
    }
  }, [patchSlot])

  const connect = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.close() } catch (_) {}
    }
    setStatus('connecting')
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      clearTimeout(timerRef.current)
    }
    ws.onmessage = ({ data }) => {
      try { handleMessage(JSON.parse(data)) } catch { /* ignore */ }
    }
    ws.onclose = () => {
      setStatus('disconnected')
      setSlots(Array.from({ length: SLOT_COUNT }, emptySlot))
      setFocusedId(null)
      timerRef.current = setTimeout(connect, RECONNECT_MS)
    }
    ws.onerror = () => ws.close()
  }, [handleMessage])

  // 點歡迎頁 → 廣播 session-start。WS 連得上就送(server 會轉發回來,三端一起切 live);
  // 連不上(或 sim 模式)則直接本地切換,確保平板自己一定會進主畫面。
  const startSession = useCallback(() => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'session-start' }))
    } else {
      setSessionMode('live')
    }
  }, [])

  // 重置回歡迎頁 → 廣播 session-end(三端一起回歡迎頁)。連不上/sim 則本地切換。
  // 之後工作人員全局控制平板也送同一則 session-end。
  const endSession = useCallback(() => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'session-end' }))
    } else {
      setSessionMode('welcome')
    }
  }, [])

  useEffect(() => {
    connect()
    // ?sim：鍵盤送給 server，由它廣播真的 tag-present → 三端一起亮。
    const detach = attachSimKeys(() => wsRef.current)
    return () => {
      detach()
      clearTimeout(timerRef.current)
      try { wsRef.current?.close() } catch (_) {}
    }
  }, [connect])

  // ── 家電視圖(以 data.id 聚合 9 個 slot)──────────────────────────────────────
  // activeIds: 目前在感應區、且為已註冊家電的 id 集合。
  const activeIds = useMemo(() => {
    const set = new Set()
    for (const s of slots) {
      const id = s.activeCard?.known ? s.activeCard.data?.id : null
      if (id) set.add(id)
    }
    return set
  }, [slots])

  const connectedReaders = useMemo(
    () => slots.filter((s) => s.connected).length,
    [slots]
  )

  // focusedId 自我修正:若目前焦點已不在 active 集合中,fallback 到 null。
  useEffect(() => {
    if (focusedId && !activeIds.has(focusedId)) setFocusedId(null)
  }, [activeIds, focusedId])

  return { status, slots, activeIds, focusedId, connectedReaders, setFocusedId, sessionMode, startSession, endSession, wsUrl: WS_URL }
}
