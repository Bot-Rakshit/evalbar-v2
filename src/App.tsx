import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { BroadcastPage } from '@/pages/BroadcastPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground dark">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/broadcast/:stateData" element={<BroadcastPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
