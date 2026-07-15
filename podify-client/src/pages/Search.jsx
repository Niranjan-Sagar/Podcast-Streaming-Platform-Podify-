import { useState, useEffect } from 'react'
import { FaSearch } from 'react-icons/fa'
import PodcastCard from '../components/PodcastCard'
import { API_BASE_URL } from '../config/api'

const CATEGORIES = ['All', 'Education', 'Technology', 'Business', 'Comedy', 'Health & Fitness']

function Search() {
  const [data, setData] = useState([])
  const [searchText, setSearchText] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [loader, setLoader] = useState(true)
  const [language, setLanguage] = useState('All')
  const fetchResults = async (pageToFetch = 1, append = false) => {
    if (pageToFetch === 1) setLoader(true)
    try {
      const params = new URLSearchParams()
      if (searchText) params.append('keyword', searchText)
      if (category !== 'All') params.append('category', category)
      if (language !== 'All') params.append('language', language)
      params.append('sortBy', sortBy)
      params.append('page', pageToFetch)
      params.append('limit', 8)

      const res = await fetch(`${API_BASE_URL}/podcasts/search?${params.toString()}`)
      if (res.ok) {
        const results = await res.json()
        const mapped = results.map(p => ({
          id: p._id,
          title: p.title,
          creator: p.creator?.name || 'Unknown Creator',
          img: p.coverImage || 'https://placehold.co/300',
          audio: null,
        }))
        setData(prev => append ? [...prev, ...mapped] : mapped)
        setHasMore(mapped.length === 8) // if we got a full page, assume more exist
        setPage(pageToFetch)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoader(false)
    }
  }

  const loadMore = () => {
    fetchResults(page + 1, true)
  }

  // Re-run search whenever filters change (debounced slightly for the text box)
  useEffect(() => {
    const t = setTimeout(() => fetchResults(1, false), 400)
    return () => clearTimeout(t)
  }, [searchText, category, sortBy, language])

  return (
    <div>
      <h2 className="page-title mb-4">Search</h2>

      <div className="d-flex flex-wrap gap-3 mb-5">
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span className="input-group-text form-sp"><FaSearch /></span>
          <input
            type="text"
            className="form-control form-sp p-2"
            placeholder="Search by title or description..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            autoFocus
          />
        </div>

        <select
          className="form-select form-sp"
          style={{ maxWidth: 200 }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className="form-select form-sp"
          style={{ maxWidth: 200 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="popularity">Most Popular</option>
        </select>
      </div>

      {loader ? (
        <div className="loader-wrap">
          <div className="spinner-sp"></div>
          <p className="text-sp">Searching...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">No podcasts found. Try a different filter.</div>
      ) : (
        <>
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
          {data.map(p => (
            <div className="col" key={p.id}>
              <PodcastCard podcast={p} list={data} />
            </div>
          ))}
        </div>
        {hasMore && (
        <div className="text-center mt-4">
          <button className="btn btn-outline-sp rounded-pill px-4" onClick={loadMore}>
            Load More
          </button>
        </div>
      )}
      </>
      )}
    </div>
  )
}

export default Search