import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { API_BASE_URL } from '../config/api'
import { toast } from 'react-toastify'

const LibraryContext = createContext()

export const LibraryProvider = ({ children }) => {
  const { user, token } = useAuth()
  
  // State for both aspects of the user's data
  const [savedEpisodes, setSavedEpisodes] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all user data from MongoDB when they log in
  useEffect(() => {
    if (user && token) {
      fetchUserData()
    } else {
      setSavedEpisodes([])
      setSubscriptions([])
      setLoading(false)
    }
  }, [user, token])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      // We will build these exact backend routes next to complete the bridge
      const [episodesRes, subsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/library`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/subscriptions/mine`, { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (episodesRes.ok) setSavedEpisodes(await episodesRes.json())
      if (subsRes.ok) setSubscriptions(await subsRes.json())
    } catch (error) {
      console.error("Failed to sync library from database", error)
    } finally {
      setLoading(false)
    }
  }

  // --- EPISODE LIBRARY LOGIC ---
  const toggleSaveEpisode = async (episode) => {
    if (!user) return toast.info("Please log in to save episodes")

    const isSaved = savedEpisodes.some(e => e._id === episode._id || e.id === episode.id)
    const method = isSaved ? 'DELETE' : 'POST'

    // Optimistic UI Update (feels instant to the user)
    setSavedEpisodes(prev => isSaved 
      ? prev.filter(e => e._id !== episode._id && e.id !== episode.id)
      : [...prev, episode]
    )

    try {
      const res = await fetch(`${API_BASE_URL}/users/library/${episode._id || episode.id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Database sync failed')
    } catch (error) {
      toast.error("Failed to save to database")
      fetchUserData() // Revert UI on failure
    }
  }

  const isEpisodeSaved = (episodeId) => {
    return savedEpisodes.some(e => e._id === episodeId || e.id === episodeId)
  }

  // --- PODCAST SUBSCRIPTION LOGIC ---
  const toggleSubscription = async (podcastId) => {
    if (!user) return toast.info("Please log in to subscribe")

    const isSubscribed = subscriptions.some(p => p._id === podcastId || p.id === podcastId)
    const method = isSubscribed ? 'DELETE' : 'POST'

    setSubscriptions(prev => isSubscribed 
      ? prev.filter(p => p._id !== podcastId && p.id !== podcastId)
      : [...prev, { _id: podcastId }] // Temporary mock object until fetch finishes
    )

    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/${podcastId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Subscription failed')
      fetchUserData() // Pull fresh populated data
    } catch (error) {
      toast.error("Failed to update subscription")
      fetchUserData()
    }
  }

  const isSubscribed = (podcastId) => {
    return subscriptions.some(p => p._id === podcastId || p.id === podcastId)
  }

  return (
    <LibraryContext.Provider value={{ 
      savedEpisodes, 
      subscriptions, 
      loading,
      toggleSaveEpisode, 
      isEpisodeSaved,
      toggleSubscription,
      isSubscribed
    }}>
      {children}
    </LibraryContext.Provider>
  )
}

export const useLibrary = () => useContext(LibraryContext)