import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './style.css'

// 不包 StrictMode:其 dev 雙重 render 會讓 framer-motion 的 AnimatePresence
// exit 動畫卡住(idle 卡片停在 opacity:0、新卡片不掛載)。
createRoot(document.getElementById('root')).render(<App />)
