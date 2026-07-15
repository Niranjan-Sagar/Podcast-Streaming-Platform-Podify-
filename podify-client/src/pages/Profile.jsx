import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'
import { FaCamera, FaSave } from 'react-icons/fa'

const COUNTRIES = ['Not specified', 'India', 'United States', 'United Kingdom', 'Other']
const AGE_GROUPS = ['Not specified', '13-17', '18-24', '25-34', '35-44', '45+']

function Profile() {
  const { token, updateUser } = useAuth()
  const fileInputRef = useRef()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [country, setCountry] = useState('Not specified')
  const [ageGroup, setAgeGroup] = useState('Not specified')
  const [bio, setBio] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setName(data.name || '')
          setCountry(data.country || 'Not specified')
          setAgeGroup(data.ageGroup || 'Not specified')
          setBio(data.bio || '')
        } else {
          toast.error('Failed to load profile')
        }
      } catch (error) {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchProfile()
  }, [token])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('country', country)
    formData.append('ageGroup', ageGroup)
    formData.append('bio', bio)
    if (imageFile) formData.append('profileImage', imageFile)

    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      if (!res.ok) throw new Error('Failed to update profile')
      const updated = await res.json()
      setProfile(updated)
      updateUser({ name: updated.name, profileImage: updated.profileImage })
      toast.success('Profile updated')
      setImageFile(null)
      setPreviewUrl(null)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loader-wrap">
        <div className="spinner-sp"></div>
        <p className="text-sp">Loading profile...</p>
      </div>
    )
  }

  const displayImage = previewUrl
    ? previewUrl
    : profile.profileImage || 'https://placehold.co/150'

  return (
    <div className="container py-4" style={{ maxWidth: 600 }}>
      <h2 className="page-title mb-4">Your Profile</h2>

      <div className="card bg-body-secondary border-0 p-4">
        <form onSubmit={handleSave}>
          <div className="d-flex flex-column align-items-center mb-4">
            <div className="position-relative mb-2">
              <img
                src={displayImage}
                alt="Profile"
                className="rounded-circle"
                style={{ width: 120, height: 120, objectFit: 'cover' }}
              />
              <button
                type="button"
                className="btn btn-green rounded-circle position-absolute d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, bottom: 0, right: 0, padding: 0 }}
                onClick={() => fileInputRef.current.click()}
                title="Change profile photo"
              >
                <FaCamera />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
            <span className="badge bg-success text-capitalize">{profile.role}</span>
          </div>

          <div className="mb-3">
            <label className="form-label text-sp">Full Name</label>
            <input
              type="text"
              className="form-control form-sp"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-sp">Email</label>
            <input
              type="email"
              className="form-control form-sp"
              value={profile.email}
              disabled
              title="Email cannot be changed"
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-sp">Bio</label>
            <textarea
              className="form-control form-sp"
              rows="3"
              maxLength="300"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell listeners a bit about yourself..."
            ></textarea>
            <div className="text-sp small mt-1">{bio.length}/300</div>
          </div>

          <div className="d-flex gap-3 mb-4">
            <div className="flex-fill">
              <label className="form-label text-sp">Country</label>
              <select className="form-select form-sp" value={country} onChange={e => setCountry(e.target.value)}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-fill">
              <label className="form-label text-sp">Age Group</label>
              <select className="form-select form-sp" value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
                {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-green w-100" disabled={saving}>
            <FaSave className="me-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile