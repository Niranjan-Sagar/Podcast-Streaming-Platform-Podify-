import { useState, useEffect } from 'react'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { FaPlay, FaPause, FaHeart, FaTrash, FaWifi } from 'react-icons/fa'
import { getAllOfflineEpisodes, deleteEpisodeOffline } from '../utils/offlineStorage'

function Library() {
  const { savedEpisodes, loading, toggleSaveEpisode } = useLibrary()
  const { current, isPlaying, playTrack } = usePlayer()
  const { user } = useAuth()
  const [offlineEpisodes, setOfflineEpisodes] = useState([])

  const loadOfflineEpisodes = async () => {
    if (!user) return
    const episodes = await getAllOfflineEpisodes(user.id)
    setOfflineEpisodes(episodes)
  }

  useEffect(() => {
    loadOfflineEpisodes()
  }, [user])

  const handlePlayOffline = (episode) => {
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

  const handleRemoveOffline = async (episodeId) => {
    await deleteEpisodeOffline(episodeId, user.id)
    loadOfflineEpisodes()
  }

  const handlePlay = (episode) => {
    const track = {
      id: episode._id,
      title: episode.title,
      creator: episode.podcastId?.title || 'Podcast',
      img: episode.podcastId?.coverImage || 'https://placehold.co/300',
      audio: episode.audioUrl,
    }
    playTrack(track, savedEpisodes.map(e => ({
      id: e._id,
      title: e.title,
      creator: e.podcastId?.title || 'Podcast',
      img: e.podcastId?.coverImage || 'https://placehold.co/300',
      audio: e.audioUrl,
    })))
  }

  if (loading) {
    return (
      <div>
        <h2 className="page-title mb-4">Your Library</h2>
        <div className="loader-wrap">
          <div className="spinner-sp"></div>
          <p className="text-sp">Loading your library...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="page-title mb-4">Your Library</h2>

      {savedEpisodes.length === 0 ? (
        <div className="empty-state">
          <p className="mb-0">You haven't saved any episodes yet.</p>
          <p className="text-sp small">Tap the heart icon on any episode to save it here.</p>
        </div>
      ) : (
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
          {savedEpisodes.map(episode => {
            const isCurrentTrack = current?.id === episode._id
            return (
              <div className="col" key={episode._id}>
                <div className="card-sp p-3 h-100">
                  <div className="position-relative">
                    <img
                      src={episode.podcastId?.coverImage || 'https://placehold.co/300'}
                      className="img-sp-wide w-100 mb-3"
                      alt={episode.title}
                    />
                    <button className="play-overlay" onClick={() => handlePlay(episode)}>
                      {isCurrentTrack && isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                  </div>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="overflow-hidden">
                      <h6 className={`fw-bold text-truncate mb-1 ${isCurrentTrack ? 'text-green' : ''}`}>{episode.title}</h6>
                      <p className="text-sp small mb-0">{episode.podcastId?.title || 'Podcast'}</p>
                    </div>
                    <button className="save-btn active" onClick={() => toggleSaveEpisode(episode)} title="Remove from Your Library">
                      <FaHeart />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Library