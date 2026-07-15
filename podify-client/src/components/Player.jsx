import { useEffect, useRef } from 'react'
import { useState } from 'react'
import { FaPlayCircle, FaPauseCircle, FaStepBackward, FaStepForward, FaVolumeUp, FaVolumeMute, FaListUl, FaArrowUp, FaArrowDown, FaTimes, FaChevronUp } from 'react-icons/fa'
import { usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'
function formatTime(sec) {
  if (!sec || Number.isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function Player() {
  const {
    current, isPlaying, currentTime, duration, volume, queue, playbackRate,
    togglePlay, playNext, playPrev, seekTo, changeVolume, changePlaybackRate,
    removeFromQueue, moveQueueItem, playTrack,
  } = usePlayer()
  const [showQueue, setShowQueue] = useState(false)
  const [showMobileExpanded, setShowMobileExpanded] = useState(false)
  const [showMobileQueue, setShowMobileQueue] = useState(false)
  const { token } = useAuth()
  const loggedCompletionRef = useRef(null)

  useEffect(() => {
    if (!current || !token || !duration) return
    const isRealEpisodeId = /^[0-9a-fA-F]{24}$/.test(current.id)
    if (!isRealEpisodeId) return
    if (loggedCompletionRef.current === current.id) return

    const progress = currentTime / duration
    if (progress >= 0.9) {
      loggedCompletionRef.current = current.id
      fetch(`${API_BASE_URL}/users/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          episodeId: current.id,
          progressInSeconds: Math.floor(currentTime),
          completed: true,
        })
      }).catch(err => console.error('Failed to log history', err))
    }
  }, [currentTime, duration, current, token])

  useEffect(() => {
    loggedCompletionRef.current = null
  }, [current?.id])

  if (!current) {
    return (
      <div className="player-h d-flex align-items-center justify-content-center px-3 w-100">
        <span className="text-sp small">Pick an episode to start listening</span>
      </div>
    )
  }

  const idx = queue.findIndex(t => t.id === current.id)
  const upNext = queue.length > 1 ? queue[(idx + 1) % queue.length] : null

  return (
    <div className="player-h d-flex align-items-center justify-content-between px-3 w-100">

      {/* Left: Episode Info */}
      <div className="d-flex align-items-center w-50 w-md-25">
        <img src={current.img} alt="cover" className="img-sp me-2 me-md-3" style={{ width: '44px' }} />
        <div className="overflow-hidden">
          <div className="fw-bold fs-6 text-truncate">{current.title}</div>
          <div className="text-sp small text-truncate d-none d-sm-block">{current.creator}</div>
        </div>
      </div>

      {/* Center: Playback Controls (desktop only) */}
      <div className="d-none d-md-flex flex-column align-items-center w-50" style={{ maxWidth: 500 }}>
        <div className="d-flex align-items-center gap-3 mb-1">
          <FaStepBackward className="text-sp fs-5" role="button" onClick={playPrev} title="Previous" />
          {isPlaying ? (
            <FaPauseCircle className="fs-1" role="button" onClick={togglePlay} title="Pause" />
          ) : (
            <FaPlayCircle className="fs-1" role="button" onClick={togglePlay} title="Play" />
          )}
          <FaStepForward className="text-sp fs-5" role="button" onClick={playNext} title="Next" />
        </div>

        {upNext && upNext.id !== current.id && (
          <div className="text-sp small mb-1 text-truncate" style={{ maxWidth: '100%' }}>
            Up Next: {upNext.title}
          </div>
        )}

        <div className="d-flex align-items-center w-100 gap-2">
          <span className="text-sp small" style={{ minWidth: 36 }}>{formatTime(currentTime)}</span>
          <input
            type="range"
            className="range-sp w-100"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
          />
          <span className="text-sp small" style={{ minWidth: 36 }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Mobile-only compact controls: play/pause + expand */}
      <div className="d-flex d-md-none align-items-center gap-3">
        <FaChevronUp
          className="text-sp fs-5"
          role="button"
          onClick={() => setShowMobileExpanded(true)}
          title="Expand player"
        />
        {isPlaying ? (
          <FaPauseCircle className="fs-1" role="button" onClick={togglePlay} title="Pause" />
        ) : (
          <FaPlayCircle className="fs-1" role="button" onClick={togglePlay} title="Play" />
        )}
      </div>

      {/* Right: Speed + Volume Controls (desktop only) */}
      <div className="d-none d-md-flex align-items-center justify-content-end w-25 gap-2">
        <select
          className="form-select form-select-sm form-sp"
          style={{ width: 70 }}
          value={playbackRate}
          onChange={(e) => changePlaybackRate(Number(e.target.value))}
          title="Playback speed"
        >
          <option value="0.5">0.5x</option>
          <option value="1">1x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
        <div className="position-relative">
          <button
            className="btn btn-dark rounded-circle d-flex justify-content-center align-items-center"
            style={{ width: '32px', height: '32px' }}
            onClick={() => setShowQueue(prev => !prev)}
            title="Queue"
          >
            <FaListUl className="text-sp" style={{ fontSize: '0.85rem' }} />
          </button>

          {showQueue && (
            <div
              className="position-absolute bg-body-secondary rounded-3 p-2 shadow"
              style={{ bottom: '110%', right: 0, width: '320px', maxHeight: '400px', overflowY: 'auto', zIndex: 20 }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                <span className="fw-bold small">Queue</span>
                <button className="btn-close btn-close-white" style={{ fontSize: '0.7rem' }} onClick={() => setShowQueue(false)}></button>
              </div>
              {queue.length === 0 ? (
                <p className="text-sp small text-center py-3 mb-0">Queue is empty.</p>
              ) : (
                queue.map((track, index) => (
                  <div
                    key={track.id}
                    className={`d-flex align-items-center gap-2 p-2 rounded ${current?.id === track.id ? 'bg-hover' : ''}`}
                  >
                    <img src={track.img} alt={track.title} style={{ width: 32, height: 32, objectFit: 'cover' }} className="rounded" />
                    <div className="flex-grow-1 overflow-hidden" style={{ cursor: 'pointer' }} onClick={() => playTrack(track, queue)}>
                      <div className={`small text-truncate ${current?.id === track.id ? 'text-green fw-bold' : ''}`}>{track.title}</div>
                      <div className="text-sp text-truncate" style={{ fontSize: '0.7rem' }}>{track.creator}</div>
                    </div>
                    <div className="d-flex flex-column">
                      <button className="save-btn p-0" style={{ fontSize: '0.6rem' }} onClick={() => moveQueueItem(index, -1)} disabled={index === 0} title="Move up">
                        <FaArrowUp />
                      </button>
                      <button className="save-btn p-0" style={{ fontSize: '0.6rem' }} onClick={() => moveQueueItem(index, 1)} disabled={index === queue.length - 1} title="Move down">
                        <FaArrowDown />
                      </button>
                    </div>
                    <button className="save-btn p-0" onClick={() => removeFromQueue(track.id)} title="Remove">
                      <FaTimes />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {volume === 0 ? <FaVolumeMute className="text-sp" /> : <FaVolumeUp className="text-sp" />}
        <input
          type="range"
          className="range-sp w-50"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => changeVolume(Number(e.target.value))}
        />
      </div>

      {/* Mobile full-screen expanded player */}
      {showMobileExpanded && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-base d-flex flex-column p-4"
          style={{ zIndex: 2000 }}
        >
          <div className="d-flex justify-content-end mb-3">
            <button className="save-btn fs-4" onClick={() => setShowMobileExpanded(false)} title="Close">
              <FaTimes />
            </button>
          </div>

          <div className="d-flex flex-column align-items-center flex-grow-1 justify-content-center">
            <img src={current.img} alt="cover" className="rounded mb-4" style={{ width: '70%', maxWidth: 280, aspectRatio: '1/1', objectFit: 'cover' }} />
            <h5 className="fw-bold text-center text-truncate w-100 mb-1">{current.title}</h5>
            <p className="text-sp text-center mb-4">{current.creator}</p>

            <div className="d-flex align-items-center w-100 gap-2 mb-3">
              <span className="text-sp small" style={{ minWidth: 36 }}>{formatTime(currentTime)}</span>
              <input
                type="range"
                className="range-sp w-100"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
              />
              <span className="text-sp small" style={{ minWidth: 36 }}>{formatTime(duration)}</span>
            </div>

            <div className="d-flex align-items-center gap-4 mb-4">
              <FaStepBackward className="text-sp fs-3" role="button" onClick={playPrev} title="Previous" />
              {isPlaying ? (
                <FaPauseCircle style={{ fontSize: '4rem' }} role="button" onClick={togglePlay} title="Pause" />
              ) : (
                <FaPlayCircle style={{ fontSize: '4rem' }} role="button" onClick={togglePlay} title="Play" />
              )}
              <FaStepForward className="text-sp fs-3" role="button" onClick={playNext} title="Next" />
            </div>

            <div className="d-flex align-items-center w-100 gap-3 mb-3">
              {volume === 0 ? <FaVolumeMute className="text-sp" /> : <FaVolumeUp className="text-sp" />}
              <input
                type="range"
                className="range-sp w-100"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
              />
            </div>

            <div className="d-flex align-items-center justify-content-between w-100">
              <select
                className="form-select form-select-sm form-sp"
                style={{ width: 90 }}
                value={playbackRate}
                onChange={(e) => changePlaybackRate(Number(e.target.value))}
                title="Playback speed"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
              <button
                className="btn btn-outline-light btn-sm rounded-pill d-flex align-items-center gap-2"
                onClick={() => setShowMobileQueue(prev => !prev)}
              >
                <FaListUl /> Queue
              </button>
            </div>

            {showMobileQueue && (
              <div className="w-100 mt-3 overflow-auto" style={{ maxHeight: '30vh' }}>
                {queue.length === 0 ? (
                  <p className="text-sp small text-center py-3 mb-0">Queue is empty.</p>
                ) : (
                  queue.map((track, index) => (
                    <div
                      key={track.id}
                      className={`d-flex align-items-center gap-2 p-2 rounded ${current?.id === track.id ? 'bg-hover' : ''}`}
                    >
                      <img src={track.img} alt={track.title} style={{ width: 32, height: 32, objectFit: 'cover' }} className="rounded" />
                      <div className="flex-grow-1 overflow-hidden" style={{ cursor: 'pointer' }} onClick={() => playTrack(track, queue)}>
                        <div className={`small text-truncate ${current?.id === track.id ? 'text-green fw-bold' : ''}`}>{track.title}</div>
                        <div className="text-sp text-truncate" style={{ fontSize: '0.7rem' }}>{track.creator}</div>
                      </div>
                      <div className="d-flex flex-column">
                        <button className="save-btn p-0" style={{ fontSize: '0.6rem' }} onClick={() => moveQueueItem(index, -1)} disabled={index === 0} title="Move up">
                          <FaArrowUp />
                        </button>
                        <button className="save-btn p-0" style={{ fontSize: '0.6rem' }} onClick={() => moveQueueItem(index, 1)} disabled={index === queue.length - 1} title="Move down">
                          <FaArrowDown />
                        </button>
                      </div>
                      <button className="save-btn p-0" onClick={() => removeFromQueue(track.id)} title="Remove">
                        <FaTimes />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Player