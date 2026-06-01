// ── F 區 9 個家電(已 freeze 的 id 字串,三端不准改)─────────────────────────────
// id 字串必須跟桌面 / 牆面完全一致:
//   door / ac / light / socket / curtain / sound / hrv / camera / sensor
// (camera / sensor 是第 8、9 個,對齊牆面 f-wall/src/config/appliances.js CAM-08 / SEN-09)
//
// pos = 知識圖譜上的節點座標,正規化 0..1(x 右為正、y 下為正)。
// ⚠️ 目前是「均衡圖譜佈局」placeholder。等拿到空間平面渲染圖 + 各家電實際位置後,
//    只要改這裡的 pos(或之後改成讀平面圖座標),其餘程式不用動。
//    若要疊平面圖,把圖片放 public/floorplan.png 並在 App 開啟 background。

export const APPLIANCES = [
  {
    id: 'hrv',
    label: '新風機',
    sub: '全熱交換機',
    pos: { x: 0.8, y: 0.22 },
    detail: {
      metric: '用電量',
      unit: 'kWh',
      today: { label: '今日用電量', value: 28.5, deltaPct: -12, deltaColor: 'good' },
      month: { label: '本月累積用電量', value: 856.7, target: 1200 },
      maint: [
        { id: 'filter', name: '濾網清潔', last: '2026/05/20', next: '2026/06/20', status: 'warn', label: '即將到期' },
        { id: 'core', name: '熱交換芯清潔', last: '2026/04/20', next: '2026/07/20', status: 'ok', label: '正常' },
        { id: 'fan', name: '風扇檢查', last: '2026/05/10', next: '2026/08/10', status: 'ok', label: '正常' },
      ],
    },
  },
  {
    id: 'ac',
    label: '冷氣',
    sub: '空調系統',
    pos: { x: 0.56, y: 0.22 },
    detail: {
      metric: '用電量',
      unit: 'kWh',
      today: { label: '今日用電量', value: 41.2, deltaPct: 8, deltaColor: 'neutral' },
      month: { label: '本月累積用電量', value: 1124.0, target: 1500 },
      maint: [
        { id: 'filter', name: '濾網清潔', last: '2026/05/01', next: '2026/06/01', status: 'warn', label: '即將到期' },
        { id: 'gas', name: '冷媒檢查', last: '2026/03/15', next: '2026/09/15', status: 'ok', label: '正常' },
        { id: 'coil', name: '盤管清潔', last: '2026/04/10', next: '2026/10/10', status: 'ok', label: '正常' },
      ],
    },
  },
  {
    id: 'curtain',
    label: '窗簾',
    sub: '電動窗簾',
    pos: { x: 0.37, y: 0.12 },
    detail: {
      metric: '啟閉次數',
      unit: '次',
      today: { label: '今日啟閉', value: 12, deltaPct: 0, deltaColor: 'neutral' },
      month: { label: '本月累積啟閉', value: 318, target: 500 },
      maint: [
        { id: 'motor', name: '馬達檢查', last: '2026/02/20', next: '2026/08/20', status: 'ok', label: '正常' },
        { id: 'rail', name: '軌道潤滑', last: '2026/04/01', next: '2026/07/01', status: 'ok', label: '正常' },
      ],
    },
  },
  {
    id: 'socket',
    label: '插座',
    sub: '智慧插座',
    pos: { x: 0.74, y: 0.76 },
    detail: {
      metric: '負載功率',
      unit: 'W',
      today: { label: '目前負載', value: 320, deltaPct: -5, deltaColor: 'good' },
      month: { label: '本月累積用電量', value: 92.4, target: 150 },
      maint: [
        { id: 'temp', name: '過熱偵測', last: '2026/05/18', next: '2026/06/18', status: 'ok', label: '正常' },
        { id: 'load', name: '負載校正', last: '2026/03/30', next: '2026/09/30', status: 'ok', label: '正常' },
      ],
    },
  },
  {
    id: 'sound',
    label: '音響',
    sub: '音響系統',
    pos: { x: 0.36, y: 0.53 },
    detail: {
      metric: '播放時數',
      unit: 'hr',
      today: { label: '今日播放', value: 3.4, deltaPct: 22, deltaColor: 'neutral' },
      month: { label: '本月累積播放', value: 86.2, target: 120 },
      maint: [
        { id: 'fw', name: '韌體更新', last: '2026/05/05', next: '2026/06/05', status: 'warn', label: '有新版' },
        { id: 'cal', name: '聲學校正', last: '2026/02/10', next: '2026/08/10', status: 'ok', label: '正常' },
      ],
    },
  },
  {
    id: 'light',
    label: '燈',
    sub: '智慧照明',
    pos: { x: 0.475, y: 0.4 },
    detail: {
      metric: '用電量',
      unit: 'kWh',
      today: { label: '今日用電量', value: 6.8, deltaPct: -3, deltaColor: 'good' },
      month: { label: '本月累積用電量', value: 198.5, target: 300 },
      maint: [
        { id: 'led', name: 'LED 壽命', last: '2026/01/10', next: '2027/01/10', status: 'ok', label: '正常' },
        { id: 'dim', name: '調光校正', last: '2026/04/22', next: '2026/10/22', status: 'ok', label: '正常' },
      ],
    },
  },
  {
    id: 'door',
    label: '門',
    sub: '智慧門鎖',
    pos: { x: 0.1, y: 0.82 },
    detail: {
      metric: '感應記錄',
      unit: '次',
      today: { label: '今日感應次數', value: 24, deltaPct: 18, deltaColor: 'neutral' },
      month: { label: '本月累積感應', value: 392, target: 600 },
      maint: [
        { id: 'battery', name: '電池檢查', last: '2026/04/10', next: '2026/07/10', status: 'ok', label: '正常' },
        { id: 'sensor', name: '感應器校正', last: '2026/03/22', next: '2026/06/22', status: 'warn', label: '即將到期' },
        { id: 'lock', name: '鎖具檢查', last: '2026/05/01', next: '2026/11/01', status: 'ok', label: '正常' },
      ],
    },
  },
  {
    id: 'camera',
    label: '攝影機',
    sub: '安防監控',
    pos: { x: 0.2, y: 0.6 },
    detail: {
      metric: '錄影時數',
      unit: 'hr',
      today: { label: '今日錄影', value: 24, deltaPct: 0, deltaColor: 'neutral' },
      month: { label: '本月累積錄影', value: 712, target: 1000 },
      maint: [
        { id: 'lens', name: '鏡頭清潔', last: '2026/05/12', next: '2026/06/12', status: 'warn', label: '即將到期' },
        { id: 'storage', name: '儲存檢查', last: '2026/04/05', next: '2026/07/05', status: 'ok', label: '正常' },
        { id: 'motion', name: '位移偵測校正', last: '2026/03/18', next: '2026/09/18', status: 'ok', label: '正常' },
      ],
    },
  },
  {
    id: 'sensor',
    label: '感測器',
    sub: '環境感測',
    pos: { x: 0.46, y: 0.82 },
    detail: {
      metric: '偵測次數',
      unit: '次',
      today: { label: '今日偵測', value: 156, deltaPct: 5, deltaColor: 'neutral' },
      month: { label: '本月累積偵測', value: 4280, target: 6000 },
      maint: [
        { id: 'battery', name: '電池檢查', last: '2026/05/02', next: '2026/06/02', status: 'warn', label: '即將到期' },
        { id: 'calib', name: '感測校正', last: '2026/03/28', next: '2026/09/28', status: 'ok', label: '正常' },
      ],
    },
  },
]

export const APPLIANCE_BY_ID = Object.fromEntries(APPLIANCES.map((a) => [a.id, a]))

// ── 知識圖譜關聯邊(AI 推理 / 設備連動關係)──────────────────────────────────────
// from/to 為家電 id;label 描述 AI 大腦看到的連動邏輯。
// 只有「兩端都 active」的邊才會連起來;當 7 個全 active → 全圖串聯動畫。
export const EDGES = [
  { from: 'door', to: 'ac', label: '進門啟動空調' },
  { from: 'door', to: 'light', label: '進門開燈' },
  { from: 'door', to: 'hrv', label: '進門換氣' },
  { from: 'ac', to: 'hrv', label: '溫控 × 換氣聯動' },
  { from: 'ac', to: 'curtain', label: '日照負載調節' },
  { from: 'light', to: 'curtain', label: '採光補光' },
  { from: 'light', to: 'socket', label: '照明供電' },
  { from: 'socket', to: 'sound', label: '插座供電音響' },
  { from: 'curtain', to: 'hrv', label: '通風連動' },
  { from: 'door', to: 'camera', label: '門口安防連動' },
  { from: 'camera', to: 'light', label: '偵測補光' },
  { from: 'sensor', to: 'hrv', label: '空氣品質換氣' },
  { from: 'sensor', to: 'ac', label: '溫濕連動控溫' },
]

export const APPLIANCE_COUNT = APPLIANCES.length
