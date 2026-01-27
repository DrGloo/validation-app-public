import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Capture from './pages/Capture'
import History from './pages/History'
import ScreenshotViewer from './pages/ScreenshotViewer'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/history" element={<History />} />
            <Route path="/screenshot/:id" element={<ScreenshotViewer />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  )
}

export default App

