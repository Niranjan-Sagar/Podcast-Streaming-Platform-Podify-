import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaHome, FaSearch, FaBookOpen, FaHistory, FaWifi } from 'react-icons/fa'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'
import voiceLogo from '../assets/voice.png'

function Sidebar() {
  const { pathname } = useLocation()
  const { savedEpisodes } = useLibrary()
  const { playTrack } = usePlayer()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Saved library items are actually full podcast objects (see LibraryContext's
  // toggleSaveEpisode, which is called with podcasts, not episodes, from
  // PodcastCard). To play one, fetch its latest episode first — same pattern
  // PodcastCard.jsx already uses for its own play button.
  const handlePlayFromLibrary = async (podcast) => {
    try {
      const res = await fetch(`${API_BASE_URL}/podcasts/${podcast._id || podcast.id}`)
      const data = await res.json()
      if (!data.episodes || data.episodes.length === 0) return

      const latestEpisode = data.episodes[0]
      playTrack({
        id: latestEpisode._id,
        podcastId: podcast._id || podcast.id,
        title: latestEpisode.title,
        creator: podcast.creator?.name || podcast.creator,
        img: podcast.coverImage || 'https://placehold.co/300',
        audio: latestEpisode.audioUrl,
      })
    } catch (error) {
      console.error('Failed to play from library:', error)
    }
  }

  const isActive = (path) => pathname === path

  // FIX 2: Safety fallback. If data is still loading, use an empty array so it doesn't crash.
  const libraryList = savedEpisodes || []

  return (
    <div className="sidebar-w d-none d-md-flex flex-column p-3">
      <Link to="/" className="d-flex align-items-center text-white text-decoration-none fs-4 fw-bold mb-4 px-2 gap-2">
        <img src={voiceLogo} alt="Podify logo" style={{ width: 28, height: 28 }} />
        Podify
      </Link>

      <div className="bg-base rounded-3 p-3 mb-2">
        <Link to="/" className={`d-flex align-items-center fw-bold mb-3 fs-6 ${isActive('/') ? 'text-white' : 'text-sp'}`}>
          <FaHome className="me-3 fs-4" /> Home
        </Link>
        <Link to="/search" className={`d-flex align-items-center fw-bold mb-3 fs-6 ${isActive('/search') ? 'text-white' : 'text-sp'}`}>
          <FaSearch className="me-3 fs-4" /> Search
        </Link>
        <Link to="/subscriptions" className={`d-flex align-items-center fw-bold mb-3 fs-6 ${isActive('/subscriptions') ? 'text-white' : 'text-sp'}`}>
          <FaBookOpen className="me-3 fs-4" /> Subscriptions
        </Link>
        <Link to="/history" className={`d-flex align-items-center fw-bold mb-3 fs-6 ${isActive('/history') ? 'text-white' : 'text-sp'}`}>
          <FaHistory className="me-3 fs-4" /> History
        </Link>
        <Link to="/downloads" className={`d-flex align-items-center fw-bold mb-0 fs-6 ${isActive('/downloads') ? 'text-white' : 'text-sp'}`}>
          <FaWifi className="me-3 fs-4" /> Downloads
        </Link>
      </div>

      <div className="bg-base rounded-3 p-3 flex-grow-1 overflow-auto">
        <Link to="/library" className="fw-bold d-flex align-items-center text-sp mb-3 text-decoration-none">
          <FaBookOpen className="me-2 fs-5" /> Your Library
        </Link>

        {user ? (
          <>
            {libraryList.length === 0 ? (
              <p className="text-sp small">
                Podcasts you save to your library will appear here. Tap the heart icon.
              </p>
            ) : (
              <div className="d-flex flex-column gap-1">
                {/* FIX 3: Map over the safe libraryList */}
                {libraryList.map(track => (
                  <button
                    key={track._id || track.id}
                    onClick={() => handlePlayFromLibrary(track)}
                    className="d-flex align-items-center text-white text-decoration-none bg-hover p-2 rounded border-0 bg-transparent text-start w-100"
                  >
                    <img src={track.coverImage || track.img || 'https://placehold.co/32'} alt={track.title} className="me-2 rounded" style={{ width: 32, height: 32, objectFit: 'cover' }} />
                    <span className="text-truncate small">{track.title}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center mt-3">
            <p className="text-sp small mb-3">Log in to save podcasts and build your library.</p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-outline-light btn-sm rounded-pill w-100"
            >
              Log In
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar