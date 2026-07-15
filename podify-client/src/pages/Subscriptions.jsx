import { useState, useEffect } from 'react'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'
import { FaPlay, FaPause } from 'react-icons/fa'

function Subscriptions() {
  const { subscriptions, loading, toggleSubscription } = useLibrary()
  const { current, isPlaying, playTrack } = usePlayer()
  const { token } = useAuth()

  const [feed, setFeed] = useState([])
  const [feedLoading, setFeedLoading] = useState(true)

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/subscriptions/feed`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) setFeed(await res.json())
      } catch (error) {
        console.error(error)
      } finally {
        setFeedLoading(false)
      }
    }
    if (token) fetchFeed()
  }, [token])

  const handlePlayFeedEpisode = (episode) => {
    const track = {
      id: episode._id,
      title: episode.title,
      creator: episode.podcastId?.title || 'Podcast',
      img: episode.podcastId?.coverImage || 'https://placehold.co/300',
      audio: episode.audioUrl,
    }
    playTrack(track, [track])
  }

  // Group subscribed podcasts by creator, so each creator shows once
  // with all the podcasts of theirs the user follows nested underneath.
  // Falls back gracefully if creator wasn't populated for any reason.
  const creatorMap = {}
  subscriptions.forEach(podcast => {
    const creatorId = podcast.creator?._id || podcast.creator || 'unknown'
    if (!creatorMap[creatorId]) {
      creatorMap[creatorId] = {
        id: creatorId,
        name: podcast.creator?.name || 'Unknown Creator',
        img: podcast.creator?.profileImage || 'https://placehold.co/150',
        podcasts: [],
      }
    }
    creatorMap[creatorId].podcasts.push(podcast)
  })
  const groupedByCreator = Object.values(creatorMap)

  if (loading || feedLoading) {
    return (
      <div>
        <h2 className="page-title mb-4">Your Subscriptions</h2>
        <div className="loader-wrap">
          <div className="spinner-sp"></div>
          <p className="text-sp">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="page-title mb-4">Your Subscriptions</h2>

      <section className="mb-5">
        <h4 className="fw-bold mb-3 fs-5 section-header">Creators You Follow</h4>
        {groupedByCreator.length === 0 ? (
          <div className="empty-state">
            You're not following any podcasts yet. Hit "Follow" on any podcast card to see it here.
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {groupedByCreator.map(host => (
              <div key={host.id} className="card-sp p-3">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <img
                    src={host.img}
                    alt={host.name}
                    className="rounded-circle"
                    style={{ width: 56, height: 56, objectFit: 'cover' }}
                  />
                  <div>
                    <h6 className="fw-bold mb-0">{host.name}</h6>
                    <p className="text-sp small mb-0">
                      {host.podcasts.length} podcast{host.podcasts.length !== 1 ? 's' : ''} followed
                    </p>
                  </div>
                </div>

                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
                  {host.podcasts.map(podcast => (
                    <div className="col" key={podcast._id}>
                      <div className="card-sp p-2 h-100">
                        <img
                          src={podcast.coverImage || 'https://placehold.co/300'}
                          className="img-sp-wide w-100 mb-2"
                          alt={podcast.title}
                        />
                        <h6 className="fw-bold text-truncate mb-2" style={{ fontSize: '0.85rem' }}>{podcast.title}</h6>
                        <button
                          className="btn btn-sm btn-outline-light w-100"
                          onClick={() => toggleSubscription(podcast._id)}
                        >
                          Unfollow
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h4 className="fw-bold mb-3 fs-5 section-header">New Episodes From Your Feed</h4>
        {feed.length === 0 ? (
          <div className="empty-state">
            No new episodes yet. Follow a podcast to see their latest episodes here.
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {feed.map(episode => {
              const isCurrentTrack = current?.id === episode._id
              return (
                <div key={episode._id} className="card-sp p-3 d-flex flex-row align-items-center gap-3">
                  <img
                    src={episode.podcastId?.coverImage || 'https://placehold.co/300'}
                    alt={episode.title}
                    className="rounded"
                    style={{ width: 56, height: 56, objectFit: 'cover' }}
                  />
                  <div className="flex-grow-1 overflow-hidden">
                    <h6 className={`fw-bold text-truncate mb-0 ${isCurrentTrack ? 'text-green' : ''}`}>{episode.title}</h6>
                    <p className="text-sp small mb-0">{episode.podcastId?.title}</p>
                  </div>
                  <button className="save-btn" onClick={() => handlePlayFeedEpisode(episode)}>
                    {isCurrentTrack && isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default Subscriptions