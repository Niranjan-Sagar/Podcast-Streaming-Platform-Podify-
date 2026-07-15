import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'

function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('listener')
  const [country, setCountry] = useState('')
const [ageGroup, setAgeGroup] = useState('')
  const { signup, googleLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password || !confirm) {
      toast.error('Please fill all fields')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    const result = await signup(name, email, password, role, country, ageGroup)
    
    if (result.success) {
      toast.success('Account created successfully!')
      navigate('/')
    } else {
      toast.error(result.error || 'Failed to create account')
    }
  }

  // Passes the selected role along with the Google token
  const handleGoogleSuccess = async (credentialResponse) => {
    const result = await googleLogin(credentialResponse.credential, role)
    if (result.success) {
      toast.success('Account created with Google!')
      navigate('/')
    } else {
      toast.error(result.error || 'Google signup failed')
    }
  }

  return (
    <div className="d-flex" style={{ minHeight: '75vh' }}>
      <div className="d-none d-md-flex flex-column justify-content-center align-items-center text-center p-5" style={{ width: '45%' }}>
        <h2>Join Podify Today</h2>
        <p className="text-sp">Create an account and start discovering podcasts.</p>
      </div>
      
      <div className="d-flex justify-content-center align-items-center flex-grow-1 p-2 p-md-4">
        <div className="card bg-body-secondary p-3 p-md-4 border-0" style={{ width: '100%', maxWidth: '400px' }}>
          <div className="card-body">
            <h3 className="text-center mb-1">Create Account</h3>
            <p className="text-center text-sp mb-3">Sign up to get started</p>
            
            {/* Role Selection placed at the top so it applies to both Google and Email signup */}
            <div className="mb-4 d-flex justify-content-center gap-4 bg-dark p-2 rounded">
              <div className="form-check mb-0">
                <input className="form-check-input" type="radio" name="role" id="roleListener" value="listener" checked={role === 'listener'} onChange={(e) => setRole(e.target.value)} />
                <label className="form-check-label text-white small fw-bold" htmlFor="roleListener">Listener</label>
              </div>
              <div className="form-check mb-0">
                <input className="form-check-input" type="radio" name="role" id="roleCreator" value="creator" checked={role === 'creator'} onChange={(e) => setRole(e.target.value)} />
                <label className="form-check-label text-white small fw-bold" htmlFor="roleCreator">Creator</label>
              </div>
            </div>

            <div className="d-flex gap-2 mb-3">
  <select className="form-select form-sp" value={country} onChange={e => setCountry(e.target.value)}>
    <option value="">Country (optional)</option>
    <option>India</option>
    <option>United States</option>
    <option>United Kingdom</option>
    <option>Other</option>
  </select>
  <select className="form-select form-sp" value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
    <option value="">Age group (optional)</option>
    <option>13-17</option>
    <option>18-24</option>
    <option>25-34</option>
    <option>35-44</option>
    <option>45+</option>
  </select>
</div>

            {/* Google Signup */}
            <div className="d-flex justify-content-center mb-3">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Sign-In failed')}
                theme="filled_black"
                shape="pill"
                text="signup_with"
              />
            </div>

            <div className="d-flex align-items-center mb-3">
              <hr className="flex-grow-1" />
              <span className="mx-3 text-sp small">OR EMAIL</span>
              <hr className="flex-grow-1" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input type="text" className="form-control form-sp" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="mb-3">
                <input type="email" className="form-control form-sp" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="mb-3">
                <input type="password" className="form-control form-sp" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="mb-4">
                <input type="password" className="form-control form-sp" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-green w-100">Sign Up</button>
            </form>
            
            <p className="text-center text-sp mt-4 mb-0">
              Already have an account? <Link to="/login" className="text-green text-decoration-none">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup