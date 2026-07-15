import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaChevronLeft, FaChevronRight, FaSun, FaMoon, FaBell } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'
import { toast } from 'react-toastify'
function Navbar() {
  const { darkMode, toggleTheme } = useTheme()
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    if (!user || !token) return
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) setNotifications(await res.json())
      } catch (error) {
        console.error(error)
      }
    }
    fetchNotifications()
  }, [user, token])

  const handleBellClick = async () => {
    setShowDropdown(prev => !prev)
    if (unreadCount > 0) {
      try {
        await fetch(`${API_BASE_URL}/users/notifications/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        })
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  return (
    <nav className="d-flex justify-content-between align-items-center p-2 p-md-3 sticky-top bg-base" style={{ opacity: 0.97, zIndex: 30 }}>
      {/* Navigation History Buttons */}
      <div className="d-none d-md-flex gap-2">
        <button className="btn btn-circle-sp rounded-circle d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px' }}>
          <FaChevronLeft className="text-sp" />
        </button>
        <button className="btn btn-circle-sp rounded-circle d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px' }}>
          <FaChevronRight className="text-sp" />
        </button>
      </div>

      {/* Auth & Premium Actions */}
      <div className="d-flex align-items-center gap-3 navbar-actions">
        <button
          onClick={toggleTheme}
          className="btn btn-circle-sp rounded-circle d-flex justify-content-center align-items-center"
          style={{ width: '36px', height: '36px' }}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <FaSun className="text-warning" /> : <FaMoon className="text-sp" />}
        </button>

        <Link to="/premium" className="text-sp fw-bold text-decoration-none d-none d-md-block">Premium</Link>
        <Link to="/support" className="text-sp fw-bold text-decoration-none d-none d-md-block">Support</Link>

        {user && (
          <div className="position-relative">
            <button
              onClick={handleBellClick}
              className="btn btn-circle-sp rounded-circle d-flex justify-content-center align-items-center position-relative"
              style={{ width: '36px', height: '36px' }}
            >
              <FaBell className="text-sp" />
              {unreadCount > 0 && (
                <span className="position-absolute badge rounded-pill bg-danger" style={{ top: -2, right: -2, fontSize: '0.6rem' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div
                className="position-absolute bg-body-secondary rounded-3 p-2 shadow"
                style={{ top: '110%', right: 0, width: 'min(300px, 85vw)', maxHeight: '350px', overflowY: 'auto', zIndex: 1000 }}
              >
                {notifications.length === 0 ? (
                  <p className="text-sp small text-center py-3 mb-0">No notifications yet.</p>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="p-2 border-bottom border-secondary">
                      <p className="small mb-1">{n.message}</p>
                      <p className="text-sp" style={{ fontSize: '0.7rem' }}>{new Date(n.date).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <div className="vr bg-secondary mx-1"></div>

        {user ? (
          <>
            <Link to="/profile" className="btn btn-outline-light rounded-pill fw-bold px-3 py-1 me-2">Profile</Link>
            {user.role === 'creator' && (
              <Link to="/dashboard" className="btn btn-outline-light rounded-pill fw-bold px-3 py-1 me-2">Dashboard</Link>
            )}
            <button onClick={handleLogout} className="btn btn-light rounded-pill fw-bold px-4 py-2">Log out</button>
          </>
        ) : (
          <>
            <Link to="/signup" className="text-sp fw-bold text-decoration-none">Sign up</Link>
            <Link to="/login" className="btn btn-light rounded-pill fw-bold px-4 py-2">Log in</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar