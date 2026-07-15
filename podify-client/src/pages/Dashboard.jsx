import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'
import { FaTrash, FaEdit, FaSave, FaTimes, FaRss, FaChartBar } from 'react-icons/fa'

function Dashboard() {
  const { user, token, authLoading } = useAuth()
  const navigate = useNavigate()

  const [myPodcasts, setMyPodcasts] = useState([])
  const [loading, setLoading] = useState(true)

  const coverInputRef = useRef()
  const audioInputRef = useRef()

  const [podcastData, setPodcastData] = useState({ title: '', description: '', category: 'Education', language: 'English' })
  const [podcastFile, setPodcastFile] = useState(null)

  const [episodeData, setEpisodeData] = useState({ podcastId: '', title: '', description: '' })
  const [episodeFile, setEpisodeFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [managePodcastId, setManagePodcastId] = useState('')
  const [episodes, setEpisodes] = useState([])
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAudioFile, setEditAudioFile] = useState(null)

  const [editingPodcastId, setEditingPodcastId] = useState(null)
  const [editPodcastData, setEditPodcastData] = useState({ title: '', description: '', category: '', language: '' })
  const [editPodcastFile, setEditPodcastFile] = useState(null)

  const [demographicsPodcastId, setDemographicsPodcastId] = useState(null)
  const [demographicsData, setDemographicsData] = useState(null)
  const [demographicsLoading, setDemographicsLoading] = useState(false)
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role !== 'creator') {
      toast.error('Only creators can access the dashboard')
      navigate('/')
      return
    }
    fetchMyPodcasts()
  }, [user, navigate, authLoading])

  const fetchMyPodcasts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/podcasts/mine/list`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMyPodcasts(data)
        if (data.length > 0 && !episodeData.podcastId) {
          setEpisodeData(prev => ({ ...prev, podcastId: data[0]._id }))
        }
        if (data.length > 0 && !managePodcastId) {
          setManagePodcastId(data[0]._id)
        }
      }
    } catch (error) {
      toast.error('Failed to load your podcasts')
    } finally {
      setLoading(false)
    }
  }

  const fetchEpisodes = async (podcastId) => {
    if (!podcastId) return
    setEpisodesLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/episodes/podcast/${podcastId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setEpisodes(await res.json())
      } else {
        toast.error('Failed to load episodes')
      }
    } catch (error) {
      toast.error('Failed to load episodes')
    } finally {
      setEpisodesLoading(false)
    }
  }

  useEffect(() => {
    if (managePodcastId) fetchEpisodes(managePodcastId)
  }, [managePodcastId])

  const startEdit = (episode) => {
    setEditingId(episode._id)
    setEditTitle(episode.title)
    setEditDescription(episode.description || '')
    setEditAudioFile(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
    setEditAudioFile(null)
  }

  const saveEdit = async (episodeId) => {
    try {
      const formData = new FormData()
      formData.append('title', editTitle)
      formData.append('description', editDescription)
      if (editAudioFile) formData.append('audioFile', editAudioFile)

      const res = await fetch(`${API_BASE_URL}/episodes/${episodeId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (!res.ok) throw new Error('Failed to update episode')
      toast.success('Episode updated')
      cancelEdit()
      fetchEpisodes(managePodcastId)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteEpisode = async (episodeId) => {
    if (!window.confirm('Delete this episode permanently?')) return
    try {
      const res = await fetch(`${API_BASE_URL}/episodes/${episodeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete episode')
      toast.success('Episode deleted')
      fetchEpisodes(managePodcastId)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const startEditPodcast = (podcast) => {
    setEditingPodcastId(podcast._id)
    setEditPodcastData({
      title: podcast.title,
      description: podcast.description || '',
      category: podcast.category,
      language: podcast.language || 'English',
    })
    setEditPodcastFile(null)
  }

  const cancelEditPodcast = () => {
    setEditingPodcastId(null)
    setEditPodcastFile(null)
  }

  const savePodcastEdit = async (podcastId) => {
    try {
      const formData = new FormData()
      formData.append('title', editPodcastData.title)
      formData.append('description', editPodcastData.description)
      formData.append('category', editPodcastData.category)
      formData.append('language', editPodcastData.language)
      if (editPodcastFile) formData.append('coverImage', editPodcastFile)

      const res = await fetch(`${API_BASE_URL}/podcasts/${podcastId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (!res.ok) throw new Error('Failed to update podcast')
      toast.success('Podcast updated')
      cancelEditPodcast()
      fetchMyPodcasts()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const viewDemographics = async (podcastId) => {
    if (demographicsPodcastId === podcastId) {
      setDemographicsPodcastId(null)
      setDemographicsData(null)
      return
    }
    setDemographicsPodcastId(podcastId)
    setDemographicsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/podcasts/${podcastId}/demographics`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load demographics')
      setDemographicsData(await res.json())
    } catch (error) {
      toast.error(error.message)
      setDemographicsPodcastId(null)
    } finally {
      setDemographicsLoading(false)
    }
  }

  const handleCreatePodcast = async (e) => {
    e.preventDefault()
    if (!podcastFile) return toast.error('Please select a cover image')

    setUploading(true)
    const formData = new FormData()
    formData.append('title', podcastData.title)
    formData.append('description', podcastData.description)
    formData.append('category', podcastData.category)
    formData.append('language', podcastData.language)
    formData.append('coverImage', podcastFile)

    try {
      const res = await fetch(`${API_BASE_URL}/podcasts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (!res.ok) throw new Error('Failed to create podcast')

      toast.success('Podcast created successfully!')
      setPodcastData({ title: '', description: '', category: 'Education', language: 'English' })
      setPodcastFile(null)
      if (coverInputRef.current) coverInputRef.current.value = ''
      fetchMyPodcasts()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadEpisode = async (e) => {
    e.preventDefault()
    if (!episodeFile) return toast.error('Please select an audio file')
    if (!episodeData.podcastId) return toast.error('Please select a podcast first')

    setUploading(true)
    const formData = new FormData()
    formData.append('podcastId', episodeData.podcastId)
    formData.append('title', episodeData.title)
    formData.append('description', episodeData.description)
    formData.append('audioFile', episodeFile)

    try {
      const res = await fetch(`${API_BASE_URL}/episodes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (!res.ok) throw new Error('Failed to upload episode (Check file size limit)')

      toast.success('Episode uploaded successfully!')
      setEpisodeData({ ...episodeData, title: '', description: '' })
      setEpisodeFile(null)
      if (audioInputRef.current) audioInputRef.current.value = ''
      if (episodeData.podcastId === managePodcastId) fetchEpisodes(managePodcastId)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUploading(false)
    }
  }

  if (authLoading || loading) return <div className="text-center mt-5"><div className="spinner-sp"></div></div>

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Creator Dashboard</h2>

      <div className="row g-4 mb-5">
        <div className="col-md-6">
          <div className="card bg-body-secondary border-0 p-4 h-100">
            <h4 className="mb-3">1. Create a New Podcast</h4>
            <form onSubmit={handleCreatePodcast}>
              <div className="mb-3">
                <label className="form-label text-sp">Podcast Title</label>
                <input type="text" className="form-control form-sp" required value={podcastData.title} onChange={e => setPodcastData({ ...podcastData, title: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label text-sp">Description</label>
                <textarea className="form-control form-sp" rows="2" value={podcastData.description} onChange={e => setPodcastData({ ...podcastData, description: e.target.value })}></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label text-sp">Category</label>
                <select className="form-select form-sp" value={podcastData.category} onChange={e => setPodcastData({ ...podcastData, category: e.target.value })}>
                  <option>Education</option>
                  <option>Technology</option>
                  <option>Business</option>
                  <option>Comedy</option>
                  <option>Health & Fitness</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label text-sp">Language</label>
                <select className="form-select form-sp" value={podcastData.language} onChange={e => setPodcastData({ ...podcastData, language: e.target.value })}>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Marathi</option>
                  <option>Tamil</option>
                  <option>Telugu</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="form-label text-sp">Cover Image (Square recommended)</label>
                <input type="file" className="form-control form-sp" accept="image/*" ref={coverInputRef} onChange={e => setPodcastFile(e.target.files[0])} />
              </div>
              <button type="submit" className="btn btn-green w-100" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Create Podcast'}
              </button>
            </form>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card bg-body-secondary border-0 p-4 h-100">
            <h4 className="mb-3">2. Upload an Episode</h4>
            {myPodcasts.length === 0 ? (
              <div className="alert alert-warning">You need to create a podcast first before uploading episodes.</div>
            ) : (
              <form onSubmit={handleUploadEpisode}>
                <div className="mb-3">
                  <label className="form-label text-sp">Select Podcast</label>
                  <select className="form-select form-sp" value={episodeData.podcastId} onChange={e => setEpisodeData({ ...episodeData, podcastId: e.target.value })}>
                    {myPodcasts.map(p => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label text-sp">Episode Title</label>
                  <input type="text" className="form-control form-sp" required value={episodeData.title} onChange={e => setEpisodeData({ ...episodeData, title: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label text-sp">Description</label>
                  <textarea className="form-control form-sp" rows="2" value={episodeData.description} onChange={e => setEpisodeData({ ...episodeData, description: e.target.value })}></textarea>
                </div>
                <div className="mb-4">
                  <label className="form-label text-sp">Audio File (.mp3)</label>
                  <input type="file" className="form-control form-sp" accept="audio/*" ref={audioInputRef} onChange={e => setEpisodeFile(e.target.files[0])} />
                </div>
                <button type="submit" className="btn btn-green w-100" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Episode'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-body-secondary border-0 p-4 mb-5">
        <h4 className="mb-3">3. Manage Episodes</h4>
        {myPodcasts.length === 0 ? (
          <p className="text-sp">Create a podcast first to manage its episodes.</p>
        ) : (
          <>
            <div className="mb-3" style={{ maxWidth: 400 }}>
              <label className="form-label text-sp">Select Podcast to Manage</label>
              <select className="form-select form-sp" value={managePodcastId} onChange={e => setManagePodcastId(e.target.value)}>
                {myPodcasts.map(p => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </div>

            {episodesLoading ? (
              <div className="spinner-sp"></div>
            ) : episodes.length === 0 ? (
              <p className="text-sp">No episodes uploaded to this podcast yet.</p>
            ) : (
              <>
                <div className="d-flex gap-4 mb-3">
                  <div>
                    <div className="text-sp small">Total Plays</div>
                    <div className="fw-bold fs-4">{episodes.reduce((sum, ep) => sum + (ep.playCount || 0), 0)}</div>
                  </div>
                  <div>
                    <div className="text-sp small">Avg. Completion Rate</div>
                    <div className="fw-bold fs-4">
                      {episodes.length > 0
                        ? Math.round(episodes.reduce((sum, ep) => sum + (ep.completionRate || 0), 0) / episodes.length)
                        : 0}%
                    </div>
                  </div>
                </div>
                <div className="d-flex flex-column gap-2">
                  {episodes.map(ep => (
                    <div key={ep._id} className="border rounded p-3" style={{ borderColor: 'var(--sp-border)' }}>
                      {editingId === ep._id ? (
                        <div>
                          <input
                            type="text"
                            className="form-control form-sp mb-2"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            placeholder="Episode title"
                          />
                          <textarea
                            className="form-control form-sp mb-2"
                            rows="2"
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            placeholder="Description"
                          ></textarea>
                          <div className="mb-2">
                            <label className="form-label text-sp small">Replace audio file (optional)</label>
                            <input
                              type="file"
                              className="form-control form-sp"
                              accept="audio/*"
                              onChange={e => setEditAudioFile(e.target.files[0])}
                            />
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-green" onClick={() => saveEdit(ep._id)}>
                              <FaSave className="me-1" /> Save
                            </button>
                            <button className="btn btn-sm btn-outline-light" onClick={cancelEdit}>
                              <FaTimes className="me-1" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                          <div className="flex-grow-1 overflow-hidden">
                            <h6 className="fw-bold mb-1">{ep.title}</h6>
                            <p className="text-sp small mb-1">{ep.description || 'No description'}</p>
                            <div className="d-flex flex-wrap gap-2">
                              <span className="badge bg-secondary">{ep.playCount} plays</span>
                              <span className="badge bg-info text-dark">{Math.round(ep.completionRate || 0)}% completion rate</span>
                              <span className="badge bg-warning text-dark">{ep.downloadCount || 0} downloads</span>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="save-btn" onClick={() => startEdit(ep)} title="Edit">
                              <FaEdit />
                            </button>
                            <button className="save-btn" onClick={() => handleDeleteEpisode(ep._id)} title="Delete">
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <h3 className="fw-bold mb-4 border-top pt-4">Your Published Podcasts</h3>
      {myPodcasts.length === 0 ? (
        <p className="text-sp">You haven't created any podcasts yet.</p>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {myPodcasts.map(podcast => (
            <div className="col" key={podcast._id}>
              <div className="card bg-body-secondary border-0 p-3 h-100">
                {editingPodcastId === podcast._id ? (
                  <div>
                    <input
                      type="text"
                      className="form-control form-sp mb-2"
                      value={editPodcastData.title}
                      onChange={e => setEditPodcastData({ ...editPodcastData, title: e.target.value })}
                      placeholder="Title"
                    />
                    <textarea
                      className="form-control form-sp mb-2"
                      rows="2"
                      value={editPodcastData.description}
                      onChange={e => setEditPodcastData({ ...editPodcastData, description: e.target.value })}
                      placeholder="Description"
                    ></textarea>
                    <select
                      className="form-select form-sp mb-2"
                      value={editPodcastData.category}
                      onChange={e => setEditPodcastData({ ...editPodcastData, category: e.target.value })}
                    >
                      <option>Education</option>
                      <option>Technology</option>
                      <option>Business</option>
                      <option>Comedy</option>
                      <option>Health & Fitness</option>
                    </select>
                    <select
                      className="form-select form-sp mb-2"
                      value={editPodcastData.language}
                      onChange={e => setEditPodcastData({ ...editPodcastData, language: e.target.value })}
                    >
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Marathi</option>
                      <option>Tamil</option>
                      <option>Telugu</option>
                    </select>
                    <div className="mb-2">
                      <label className="form-label text-sp small">Replace cover image (optional)</label>
                      <input
                        type="file"
                        className="form-control form-sp"
                        accept="image/*"
                        onChange={e => setEditPodcastFile(e.target.files[0])}
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-green" onClick={() => savePodcastEdit(podcast._id)}>
                        <FaSave className="me-1" /> Save
                      </button>
                      <button className="btn btn-sm btn-outline-light" onClick={cancelEditPodcast}>
                        <FaTimes className="me-1" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex flex-row align-items-center gap-3">
                    <img
                      src={podcast.coverImage || 'https://placehold.co/150'}
                      alt={podcast.title}
                      className="rounded"
                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                    />
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-1">{podcast.title}</h6>
                      <span className="badge bg-success">{podcast.category}</span>
                      <span className="badge bg-secondary ms-1">{podcast.language || 'English'}</span>
                      <div className="text-sp small mt-1">{podcast.subscriberCount} Subscribers</div>

                      {demographicsPodcastId === podcast._id && (
                        <div className="mt-3 p-3 rounded" style={{ backgroundColor: 'var(--sp-hover)' }}>
                          {demographicsLoading ? (
                            <div className="spinner-sp mx-auto"></div>
                          ) : demographicsData && demographicsData.totalSubscribers === 0 ? (
                            <p className="text-sp small mb-0">No subscribers yet — demographics will appear once listeners follow this podcast.</p>
                          ) : demographicsData ? (
                            <div>
                              <p className="fw-bold small mb-2">{demographicsData.totalSubscribers} total subscribers</p>

                              <p className="text-sp small mb-1 fw-bold">By Country</p>
                              <div className="d-flex flex-column gap-1 mb-3">
                                {demographicsData.byCountry.map(c => (
                                  <div key={c.label} className="d-flex justify-content-between">
                                    <span className="small">{c.label}</span>
                                    <span className="small text-sp">{c.count}</span>
                                  </div>
                                ))}
                              </div>

                              <p className="text-sp small mb-1 fw-bold">By Age Group</p>
                              <div className="d-flex flex-column gap-1">
                                {demographicsData.byAgeGroup.map(a => (
                                  <div key={a.label} className="d-flex justify-content-between">
                                    <span className="small">{a.label}</span>
                                    <span className="small text-sp">{a.count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <button className="save-btn" onClick={() => startEditPodcast(podcast)} title="Edit podcast">
                        <FaEdit />
                      </button>
                      <button className="save-btn" onClick={() => viewDemographics(podcast._id)} title="View listener demographics">
                        <FaChartBar />
                      </button>
                      <button
                        className="save-btn"
                        onClick={() => {
                          const url = `http://localhost:5000/api/podcasts/${podcast._id}/rss.xml`
                          navigator.clipboard.writeText(url)
                          toast.success('RSS feed URL copied!')
                        }}
                        title="Copy RSS Feed URL"
                      >
                        <FaRss />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard