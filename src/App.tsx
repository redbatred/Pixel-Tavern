import './App.css'
import GameCanvas from './components/gameCanvas.tsx'
import AudioManager from './components/AudioManager'

function App() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <AudioManager autoStartMusic={true} preloadAudio={true} />
      <GameCanvas />
    </div>
  )
}

export default App
