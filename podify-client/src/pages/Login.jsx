import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import voiceLogo from '../assets/voice.png'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill all fields')
      return
    }

    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)

    if (result.success) {
      toast.success('Logged in successfully')
      navigate('/')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center mt-5">
      <div className="bg-body-secondary p-4 p-md-5 rounded-3 w-100" style={{ maxWidth: '450px' }}>
        <div className="text-center mb-5">
          <img src={voiceLogo} alt="Podify logo" style={{ width: 48, height: 48 }} className="mb-2" />
          <h2 className="fw-bold">Log in to Podify</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold small">Email or username</label>
            <input
              type="email"
              className="form-control form-control-lg form-sp p-3"
              placeholder="Email or username"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold small">Password</label>
            <input
              type="password"
              className="form-control form-control-lg form-sp p-3"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-green w-100 py-3 mb-4" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <hr className="my-4" />

        <p className="text-center text-sp fw-bold">
          Don't have an account? <Link to="/signup" className="text-green text-decoration-none text-decoration-underline-hover">Sign up for Podify</Link>
        </p>
      </div>
    </div>
  )
}

export default Login