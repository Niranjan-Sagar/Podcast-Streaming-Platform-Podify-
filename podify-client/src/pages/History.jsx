import { useState, useEffect } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'
import { FaPlay, FaPause } from 'react-icons/fa'

function History() {
  const { current, isPlaying, playTrack } = usePlayer()
  const { token } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) setHistory(await res.json())
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchHistory()
  }, [token])

  const handlePlay = (h) => {
    const ep = h.episodeId
    if (!ep) return
    const track = {
      id: ep._id,
      title: ep.title,
      creator: ep.podcastId?.title || 'Podcast',
      img: ep.podcastId?.coverImage || 'https://placehold.co/300',
      audio: ep.audioUrl,
    }
    playTrack(track, [track])
  }

  if (loading) {
    return (
      <div>
        <h2 className="page-title mb-4">Listening History</h2>
        <div className="loader-wrap">
          <div className="spinner-sp"></div>
          <p className="text-sp">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="page-title mb-4">Listening History</h2>

      {history.length === 0 ? (
        <div className="empty-state">
          No listening history yet. Play an episode to at least 90% completion for it to show up here.
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {history.map((h, i) => {
            const ep = h.episodeId
            if (!ep) return null
            const isCurrentTrack = current?.id === ep._id
            return (
              <div key={i} className="card-sp p-3 d-flex flex-row align-items-center gap-3">
                <img
                  src={ep.podcastId?.coverImage || 'https://placehold.co/300'}
                  alt={ep.title}
                  className="rounded"
                  style={{ width: 48, height: 48, objectFit: 'cover' }}
                />
                <div className="flex-grow-1 overflow-hidden">
                  <h6 className={`fw-bold text-truncate mb-0 ${isCurrentTrack ? 'text-green' : ''}`}>{ep.title}</h6>
                  <p className="text-sp small mb-0">{ep.podcastId?.title} · {new Date(h.lastPlayedAt).toLocaleDateString()}</p>
                </div>
                <button className="save-btn" onClick={() => handlePlay(h)}>
                  {isCurrentTrack && isPlaying ? <FaPause /> : <FaPlay />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default History