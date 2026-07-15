import { useState, useEffect } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { FaPlay, FaPause, FaTrash, FaWifi } from 'react-icons/fa'
import { getAllOfflineEpisodes, deleteEpisodeOffline } from '../utils/offlineStorage'

function Downloads() {
  const { current, isPlaying, playTrack } = usePlayer()
  const { user } = useAuth()
  const [offlineEpisodes, setOfflineEpisodes] = useState([])
  const [loading, setLoading] = useState(true)

  const loadOfflineEpisodes = async () => {
    if (!user) return
    const episodes = await getAllOfflineEpisodes(user.id)
    setOfflineEpisodes(episodes)
    setLoading(false)
  }

  useEffect(() => {
    loadOfflineEpisodes()
  }, [user])

  const handlePlay = (episode) => {
    const blobUrl = URL.createObjectURL(episode.blob)
    const track = {
      id: episode.episodeId,
      title: episode.title,
      creator: episode.creator,
      img: episode.img,
      audio: blobUrl,
    }
    playTrack(track, [track])
  }

  const handleRemove = async (episodeId) => {
    await deleteEpisodeOffline(episodeId, user.id)
    loadOfflineEpisodes()
  }

  if (loading) {
    return (
      <div>
        <h2 className="page-title mb-4">Downloads</h2>
        <div className="loader-wrap">
          <div className="spinner-sp"></div>
          <p className="text-sp">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="fw-bold mb-4 d-flex align-items-center gap-2">
        <FaWifi /> Downloads
      </h2>

      {offlineEpisodes.length === 0 ? (
        <div className="empty-state">
          No downloads yet. Tap the download icon on any podcast to save it for offline listening.
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {offlineEpisodes.map(ep => {
            const isCurrentTrack = current?.id === ep.episodeId
            return (
              <div key={ep.id} className="card-sp p-3 d-flex flex-row align-items-center gap-3">
                <img src={ep.img} alt={ep.title} className="rounded" style={{ width: 56, height: 56, objectFit: 'cover' }} />
                <div className="flex-grow-1 overflow-hidden">
                  <h6 className={`fw-bold text-truncate mb-0 ${isCurrentTrack ? 'text-green' : ''}`}>{ep.title}</h6>
                  <p className="text-sp small mb-0">{ep.creator}</p>
                </div>
                <button className="save-btn" onClick={() => handlePlay(ep)}>
                  {isCurrentTrack && isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button className="save-btn" onClick={() => handleRemove(ep.episodeId)} title="Remove download">
                  <FaTrash />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Downloads