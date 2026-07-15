import { useState, useEffect } from 'react'
import { FaPlay, FaPause, FaHeart, FaRegHeart, FaDownload, FaCheck, FaListUl } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { useLibrary } from '../context/LibraryContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'
import { saveEpisodeOffline, isEpisodeOffline } from '../utils/offlineStorage'

function PodcastCard({ podcast, list }) {
  const { current, isPlaying, playTrack, togglePlay, addToQueue } = usePlayer()
  const { isEpisodeSaved, toggleSaveEpisode, toggleSubscription, isSubscribed } = useLibrary()
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const isCurrentTrack = current?.podcastId === (podcast.id || podcast._id) || current?.id === (podcast.id || podcast._id)
  const saved = isEpisodeSaved(podcast.id || podcast._id)
  const subscribed = !podcast.audio && isSubscribed(podcast.id || podcast._id)

  const [downloading, setDownloading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (podcast.audio || !user) return
    isEpisodeOffline(podcast.id || podcast._id, user.id).then(setIsOffline)
  }, [podcast, user])

  const handlePlayClick = async () => {
    if (!user) {
      toast.info("Please log in or sign up to stream episodes.")
      navigate('/login')
      return
    }

    if (isCurrentTrack && isPlaying) {
      togglePlay()
      return
    }
    if (isCurrentTrack && !isPlaying) {
      togglePlay()
      return
    }

    if (podcast.audio) {
      playTrack(podcast, list)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/podcasts/${podcast.id || podcast._id}`)
      const data = await res.json()

      if (data.episodes && data.episodes.length > 0) {
        const latestEpisode = data.episodes[0]
        const trackToPlay = {
          id: latestEpisode._id,
          podcastId: podcast.id || podcast._id,
          title: latestEpisode.title,
          creator: podcast.creator?.name || podcast.creator,
          img: podcast.coverImage || podcast.img,
          audio: latestEpisode.audioUrl
        }
        playTrack(trackToPlay, list)
      } else {
        toast.info("This podcast doesn't have any episodes yet.")
      }
    } catch (error) {
      toast.error("Failed to load audio from database")
    }
  }

  const handleLibraryClick = () => {
    if (!user) {
      toast.info("Create an account to build your library!")
      navigate('/signup')
      return
    }
    if (podcast.audio) {
      toast.info("This is a demo podcast and can't be saved yet.")
      return
    }
    toggleSaveEpisode(podcast)
  }

  const handleSubscribeClick = (e) => {
    e.stopPropagation()
    if (!user) {
      toast.info("Log in to subscribe to podcasts!")
      navigate('/login')
      return
    }
    if (podcast.audio) {
      toast.info("This is a demo podcast and can't be subscribed to yet.")
      return
    }
    toggleSubscription(podcast.id || podcast._id)
  }

  const handleAddToQueue = async (e) => {
    e.stopPropagation()
    if (podcast.audio) {
      toast.info("Demo podcasts can't be queued.")
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/podcasts/${podcast.id || podcast._id}`)
      const data = await res.json()
      if (!data.episodes || data.episodes.length === 0) {
        toast.info("This podcast doesn't have any episodes yet.")
        return
      }
      const latestEpisode = data.episodes[0]
      addToQueue({
        id: latestEpisode._id,
        title: latestEpisode.title,
        creator: podcast.creator?.name || podcast.creator,
        img: podcast.coverImage || podcast.img,
        audio: latestEpisode.audioUrl,
      })
      toast.success("Added to queue")
    } catch (error) {
      toast.error("Failed to add to queue")
    }
  }
  const handleDownload = async (e) => {
    e.stopPropagation()
    if (!user) {
      toast.info("Log in to download episodes for offline listening.")
      navigate('/login')
      return
    }
    if (!user.isPremium) {
      toast.info("Offline downloads are a Premium feature.")
      navigate('/premium')
      return
    }
    if (podcast.audio) {
      toast.info("Demo podcasts can't be downloaded.")
      return
    }
    if (isOffline) {
      toast.info("Already downloaded.")
      return
    }

    setDownloading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/podcasts/${podcast.id || podcast._id}`)
      const data = await res.json()
      if (!data.episodes || data.episodes.length === 0) {
        toast.info("This podcast doesn't have any episodes yet.")
        return
      }
      const latestEpisode = data.episodes[0]
      await saveEpisodeOffline({
        id: podcast.id || podcast._id,
        title: latestEpisode.title,
        creator: podcast.creator?.name || podcast.creator,
        img: podcast.coverImage || podcast.img,
        audio: latestEpisode.audioUrl,
      }, user.id)

      const downloadRes = await fetch(`${API_BASE_URL}/episodes/${latestEpisode._id}/download`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!downloadRes.ok) {
        const errData = await downloadRes.json().catch(() => ({}))
        toast.error(errData.message || "Download failed on the server.")
        return
      }

      setIsOffline(true)
      toast.success("Downloaded for offline listening!")
    } catch (error) {
      toast.error("Download failed. Try again.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="card-sp p-3 h-100">
      <div className="position-relative">
        <img
          src={podcast.coverImage || podcast.img}
          className="img-sp-wide w-100 mb-3"
          alt={podcast.title}
        />
        <button
          className="play-overlay"
          onClick={handlePlayClick}
          title={isCurrentTrack && isPlaying ? 'Pause' : 'Play'}
        >
          {isCurrentTrack && isPlaying ? <FaPause /> : <FaPlay />}
        </button>
      </div>

      <div className="overflow-hidden mb-2">
        <h6 className={`fw-bold text-truncate mb-1 ${isCurrentTrack ? 'text-green' : ''}`}>{podcast.title}</h6>
        <p className="text-sp small mb-0 text-truncate">{podcast.creator?.name || podcast.creator}</p>
      </div>
      <div className="d-flex align-items-center justify-content-end">
        <button
          className={`save-btn ${saved ? 'active' : ''}`}
          onClick={handleLibraryClick}
          title={saved ? 'Remove from Your Library' : 'Save to Your Library'}
        >
          {saved ? <FaHeart /> : <FaRegHeart />}
        </button>
        {!podcast.audio && (
          <button
            className={`btn btn-sm ${subscribed ? 'btn-green' : 'btn-outline-light'} ms-2`}
            onClick={handleSubscribeClick}
            style={{ fontSize: '0.7rem', padding: '2px 10px' }}
          >
            {subscribed ? 'Following' : 'Follow'}
          </button>
        )}
        {!podcast.audio && (
          <button
            className="save-btn ms-2"
            onClick={handleDownload}
            disabled={downloading}
            title={
              !user?.isPremium
                ? 'Premium feature — click to upgrade'
                : isOffline
                  ? 'Downloaded for offline listening'
                  : 'Download for offline listening'
            }
          >
            {isOffline ? <FaCheck className="text-green" /> : <FaDownload className={!user?.isPremium ? 'text-warning' : ''} />}
          </button>
        )}

        {!podcast.audio && (
          <button className="save-btn ms-2" onClick={handleAddToQueue} title="Add to Queue">
            <FaListUl />
          </button>
        )}
      </div>
    </div>
  )
}

export default PodcastCard