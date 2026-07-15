import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Player from './components/Player'
import BottomNav from './components/BottomNav'
import AdInterstitial from './components/AdInterstitial'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Premium from './pages/Premium'
import Support from './pages/Support'
import './App.css'
import Dashboard from './pages/Dashboard'
import Subscriptions from './pages/Subscriptions'
import History from './pages/History'
import Downloads from './pages/Downloads'
import Profile from './pages/Profile'
import { useAuth } from './context/AuthContext'
import { usePlayer } from './context/PlayerContext'

function AdSync() {
  const { user } = useAuth()
  const { setPremiumStatus } = usePlayer()

  useEffect(() => {
    setPremiumStatus(!!user?.isPremium)
  }, [user?.isPremium])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <AdSync />
      {/* Main App Container: Full screen height, Flex Column */}
      <div className="d-flex flex-column vh-100">

        {/* Top Section: Sidebar + Main Dynamic Content */}
        <div className="d-flex flex-grow-1 overflow-hidden">
          <Sidebar />

          {/* Main Browsing Area */}
          <main className="d-flex flex-column flex-grow-1 bg-base main-content overflow-auto mt-2 mb-2">
            <Navbar />
            <div className="p-2 p-md-4">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/library" element={<Library />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/support" element={<Support />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/history" element={<History />} />
                <Route path="/downloads" element={<Downloads />} />
              </Routes>
            </div>
          </main>
        </div>

        {/* Bottom Section: Persistent Audio Player */}
        {/* Bottom Section: Persistent Audio Player */}
        <Player />
       <BottomNav/>
       <AdInterstitial />

      </div>
    </BrowserRouter>
  )
}

export default App
