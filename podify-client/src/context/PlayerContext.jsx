import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

const PlayerContext = createContext()

// How often (in seconds of actual listening time) a free user sees an ad interstitial.
const AD_INTERVAL_SECONDS = 15 // every 2 minutes of playback

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio())
  const hlsRef = useRef(null)
  const listenedSinceLastAdRef = useRef(0)
  const lastTickRef = useRef(null)

  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showAd, setShowAd] = useState(false)
  const [isPremiumUser, setIsPremiumUser] = useState(false)

  // Called by App.jsx once auth state is known, so the player knows whether
  // to bother tracking ad timing at all — premium users skip this entirely.
  const setPremiumStatus = (premium) => {
    setIsPremiumUser(premium)
    if (premium) {
      setShowAd(false)
      listenedSinceLastAdRef.current = 0
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    audio.volume = volume

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)

      // Ad timing: only accumulate listened-time for free users, and only
      // while actually playing (not paused, not while an ad is showing).
      if (!isPremiumUser && !showAd && !audio.paused) {
        const now = Date.now()
        if (lastTickRef.current !== null) {
          const delta = (now - lastTickRef.current) / 1000
          listenedSinceLastAdRef.current += delta
        }
        lastTickRef.current = now

        if (listenedSinceLastAdRef.current >= AD_INTERVAL_SECONDS) {
          listenedSinceLastAdRef.current = 0
          audio.pause()
          setIsPlaying(false)
          setShowAd(true)
        }
      } else {
        lastTickRef.current = Date.now()
      }
    }

    const handleLoadedMeta = () => setDuration(audio.duration || 0)
    const handleEnded = () => playNext()

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMeta)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMeta)
      audio.removeEventListener('ended', handleEnded)
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, isPremiumUser, showAd])

  const playTrack = (track, sourceList = null) => {
    if (!track || !track.audio) {
      console.error('playTrack called with invalid track (missing audio URL):', track)
      return
    }
    if (sourceList) setQueue(sourceList)

    const audio = audioRef.current
    if (current?.id === track.id) {
      togglePlay()
      return
    }

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const isHLS = track.audio.endsWith('.m3u8')
    if (isHLS && Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(track.audio)
      hls.attachMedia(audio)
      hlsRef.current = hls
    } else {
      audio.src = track.audio
    }

    audio.currentTime = 0
    audio.play()
    setCurrent(track)
    setIsPlaying(true)
    lastTickRef.current = Date.now()
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!current) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
      lastTickRef.current = Date.now()
    }
  }

  const playNext = () => {
    if (!current || queue.length === 0) return
    const idx = queue.findIndex(t => t.id === current.id)
    const next = queue[(idx + 1) % queue.length]
    playTrack(next)
  }

  const playPrev = () => {
    if (!current || queue.length === 0) return
    const idx = queue.findIndex(t => t.id === current.id)
    const prev = queue[(idx - 1 + queue.length) % queue.length]
    playTrack(prev)
  }

  const seekTo = (time) => {
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  const changeVolume = (v) => {
    audioRef.current.volume = v
    setVolume(v)
  }

  const changePlaybackRate = (rate) => {
    audioRef.current.playbackRate = rate
    setPlaybackRate(rate)
  }

  const addToQueue = (track) => {
    setQueue(prev => {
      if (prev.some(t => t.id === track.id)) return prev
      return [...prev, track]
    })
  }

  const removeFromQueue = (trackId) => {
    setQueue(prev => prev.filter(t => t.id !== trackId))
  }

  const moveQueueItem = (index, direction) => {
    setQueue(prev => {
      const newIndex = index + direction
      if (newIndex < 0 || newIndex >= prev.length) return prev
      const updated = [...prev]
        ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
      return updated
    })
  }

// Called when the free user dismisses the ad — resumes playback
  const dismissAd = () => {
    setShowAd(false)
    lastTickRef.current = Date.now()
    audioRef.current.play()
    setIsPlaying(true)
  }

  // Called when the free user clicks "Go Ad-Free" — stops playback entirely
  // instead of resuming, since they're leaving to upgrade, not continuing to listen
  const stopForUpgrade = () => {
    audioRef.current.pause()
    setIsPlaying(false)
    setShowAd(false)
  }

  return (
    <PlayerContext.Provider
      value={{
        current, isPlaying, currentTime, duration, volume, queue, playbackRate,
        showAd, dismissAd, stopForUpgrade, setPremiumStatus,
        playTrack, togglePlay, playNext, playPrev, seekTo, changeVolume, changePlaybackRate,
        addToQueue, removeFromQueue, moveQueueItem,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}