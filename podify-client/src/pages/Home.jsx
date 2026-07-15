import { useState, useEffect } from 'react'
import PodcastCard from '../components/PodcastCard'
import { API_BASE_URL } from '../config/api'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['All', 'Education', 'Technology', 'Business', 'Comedy', 'Health & Fitness']
const LANGUAGES = ['All', 'English', 'Hindi', 'Marathi', 'Tamil', 'Telugu']

function Home() {
  const { token } = useAuth()
  const [allPodcasts, setAllPodcasts] = useState([])
  const [loader, setLoader] = useState(true)
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterLanguage, setFilterLanguage] = useState('All')
  const [recommended, setRecommended] = useState([])
  const [recLoading, setRecLoading] = useState(true)

  const getPodcastData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/podcasts`)
      if (res.ok) {
        const rawPodcasts = await res.json()
        const mapped = rawPodcasts.map(p => ({
          id: p._id,
          title: p.title,
          creator: p.creator?.name || 'Unknown Creator',
          creatorImage: p.creator?.profileImage || null,
          category: p.category || 'Uncategorized',
          language: p.language || 'English',
          subscriberCount: p.subscriberCount || 0,
          img: p.coverImage || 'https://placehold.co/300',
          audio: null,
        }))
        setAllPodcasts(mapped)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoader(false)
    }
  }

  useEffect(() => {
    getPodcastData()
  }, [])

  // Recommendation logic: same as before — based on your most-played
  // category from listening history, matches your document's stated
  // "basic recommendation logic based on category, popularity, and
  // subscription history" (not a real ML model)
  useEffect(() => {
    const buildRecommendations = async () => {
      if (!token) {
        setRecLoading(false)
        return
      }
      try {
        const historyRes = await fetch(`${API_BASE_URL}/users/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!historyRes.ok) {
          setRecLoading(false)
          return
        }
        const history = await historyRes.json()
        if (history.length === 0) {
          setRecLoading(false)
          return
        }

        const categoryCounts = {}
        history.forEach(h => {
          const cat = h.episodeId?.podcastId?.category
          if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
        })
        const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
        if (!topCategory) {
          setRecLoading(false)
          return
        }

        const params = new URLSearchParams()
        params.append('category', topCategory)
        params.append('sortBy', 'popularity')
        const res = await fetch(`${API_BASE_URL}/podcasts/search?${params.toString()}`)
        if (res.ok) {
          const results = await res.json()
          setRecommended(results.slice(0, 8))
        }
      } catch (error) {
        console.error(error)
      } finally {
        setRecLoading(false)
      }
    }
    buildRecommendations()
  }, [token])

  const filteredPodcasts = allPodcasts.filter(p => {
    const categoryMatch = filterCategory === 'All' || p.category === filterCategory
    const languageMatch = filterLanguage === 'All' || p.language === filterLanguage || !p.language
    return categoryMatch && languageMatch
  })

  const categories = [...new Set(filteredPodcasts.map(p => p.category))]

  const hostMap = {}
  filteredPodcasts.forEach(p => {
    if (!hostMap[p.creator]) {
      hostMap[p.creator] = {
        name: p.creator,
        count: 0,
        img: p.creatorImage || p.img,
      }
    }
    hostMap[p.creator].count += 1
  })
  const topHosts = Object.values(hostMap).sort((a, b) => b.count - a.count)

  const popular = [...filteredPodcasts].sort((a, b) => b.subscriberCount - a.subscriberCount).slice(0, 8)

  return (
    <div>
      <div className="hero-banner mb-4">
        <h1 className="fw-bold mb-1">Welcome back 👋</h1>
        <p className="text-sp mb-0">Discover podcasts picked for you, by topic, host, and what's trending.</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="fw-bold mb-0">Made for You!</h2>
        <div className="d-flex gap-3">
          <div>
            <label className="text-sp small d-block mb-1">Category</label>
            <select className="form-select form-sp" style={{ width: 160 }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sp small d-block mb-1">Language</label>
            <select className="form-select form-sp" style={{ width: 160 }} value={filterLanguage} onChange={e => setFilterLanguage(e.target.value)}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loader ? (
        <div className="loader-wrap">
          <div className="spinner-sp"></div>
          <p className="text-sp">Loading podcasts...</p>
        </div>
      ) : filteredPodcasts.length === 0 ? (
        <div className="empty-state">
          No podcasts match these filters.
        </div>
      ) : (
        <>
          {!recLoading && recommended.length > 0 && (
            <section className="mb-5">
              <h4 className="fw-bold mb-3 fs-5 border-start border-4 border-success ps-2">Recommended For You</h4>
              <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
                {recommended.map(podcast => (
                  <div className="col" key={podcast._id}>
                    <PodcastCard podcast={podcast} list={recommended} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {popular.length > 0 && (
            <section className="mb-5">
              <h4 className="fw-bold mb-3 fs-5 border-start border-4 border-success ps-2">Most Popular</h4>
              <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
                {popular.map(p => (
                  <div className="col" key={p.id}>
                    <PodcastCard podcast={p} list={popular} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {categories.map(cat => {
            const inCategory = filteredPodcasts.filter(p => p.category === cat)
            return (
              <section className="mb-5" key={`cat-${cat}`}>
                <h4 className="fw-bold mb-3 fs-5 border-start border-4 border-success ps-2">{cat}</h4>
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
                  {inCategory.map(p => (
                    <div className="col" key={p.id}>
                      <PodcastCard podcast={p} list={inCategory} />
                    </div>
                  ))}
                </div>
              </section>
            )
          })}

          {[...new Set(filteredPodcasts.map(p => p.language))].map(lang => {
            const inLanguage = filteredPodcasts.filter(p => p.language === lang)
            return (
              <section className="mb-5" key={`lang-${lang}`}>
                <h4 className="fw-bold mb-3 fs-5 border-start border-4 border-success ps-2">{lang} Podcasts</h4>
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
                  {inLanguage.map(p => (
                    <div className="col" key={p.id}>
                      <PodcastCard podcast={p} list={inLanguage} />
                    </div>
                  ))}
                </div>
              </section>
            )
          })}

          <section>
            <h4 className="fw-bold mb-3 fs-5 border-start border-4 border-success ps-2">Top Hosts</h4>
            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
              {topHosts.map(host => (
                <div className="col" key={host.name}>
                  <div className="card-sp p-3 text-center h-100">
                    <img src={host.img} className="img-sp rounded-circle w-75 mx-auto mb-3" alt={host.name} />
                    <h6 className="fw-bold mb-1">{host.name}</h6>
                    <p className="text-sp small mb-0">{host.count} podcast{host.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default Home