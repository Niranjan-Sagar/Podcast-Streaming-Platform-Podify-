import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaSearch, FaBookOpen, FaHeadphonesAlt,FaWifi } from 'react-icons/fa'

function BottomNav() {
  const { pathname } = useLocation()
  const isActive = (path) => pathname === path

  const items = [
    { path: '/', icon: FaHome, label: 'Home' },
    { path: '/search', icon: FaSearch, label: 'Search' },
    { path: '/subscriptions', icon: FaHeadphonesAlt, label: 'Following' },
    { path: '/library', icon: FaBookOpen, label: 'Library' },
    { path: '/downloads', icon: FaWifi, label: 'Downloads' },
  ]

  return (
    <div className="d-flex d-md-none bg-base border-top" style={{ borderColor: 'var(--sp-border)' }}>
      {items.map(({ path, icon: Icon, label }) => (
        <Link
          key={path}
          to={path}
          className={`flex-fill d-flex flex-column align-items-center py-2 text-decoration-none ${isActive(path) ? 'text-white' : 'text-sp'}`}
          style={{ fontSize: '0.65rem' }}
        >
          <Icon style={{ fontSize: '1.1rem' }} className="mb-1" />
          {label}
        </Link>
      ))}
    </div>
  )
}

export default BottomNav