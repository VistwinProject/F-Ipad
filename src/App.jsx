import { useState } from 'react'
import { useNfcSync } from './lib/useNfcSync.js'
import { APPLIANCE_COUNT } from './data/appliances.js'
import GraphCanvas from './components/GraphCanvas.jsx'
import DetailCard from './components/DetailCard.jsx'
import StatusBar from './components/StatusBar.jsx'
import WelcomeScreen from './components/WelcomeScreen.jsx'

export default function App() {
  const { status, activeIds, connectedReaders, sessionMode, startSession, endSession } = useNfcSync()
  const [pickedId, setPickedId] = useState(null)
  const placed = activeIds.size
  const allLinked = placed === APPLIANCE_COUNT

  return (
    <div className="app">
      <StatusBar
        status={status}
        placed={placed}
        total={APPLIANCE_COUNT}
        connectedReaders={connectedReaders}
        allLinked={allLinked}
      />

      <div className="stage">
        <GraphCanvas
          activeIds={activeIds}
          allLinked={allLinked}
          onPick={setPickedId}
        />
        {pickedId && (
          <DetailCard
            focusedId={pickedId}
            onClose={() => setPickedId(null)}
          />
        )}
      </div>

      {sessionMode === 'live' && (
        <button
          type="button"
          className="reset-btn"
          onClick={() => { setPickedId(null); endSession() }}
          aria-label="重置回歡迎頁"
        >
          <span className="reset-btn__icon">↺</span>
          <span className="reset-btn__text">重置</span>
        </button>
      )}

      {sessionMode === 'welcome' && <WelcomeScreen onStart={startSession} />}
    </div>
  )
}
