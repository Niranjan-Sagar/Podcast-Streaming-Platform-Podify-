import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import { FaTimes } from 'react-icons/fa'
import iQoo from '../assets/iQoo-13.jpeg'
function AdInterstitial() {
  const { showAd, dismissAd, stopForUpgrade } = usePlayer()
  const navigate = useNavigate()

  if (!showAd) return null

  const handleGoAdFree = () => {
    stopForUpgrade()
    navigate('/premium')
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000 }}
    >
      <div
        className="bg-body-secondary rounded-3 p-4 text-center position-relative"
        style={{ maxWidth: 420, width: '90%' }}
      >
        <button
          className="save-btn position-absolute"
          style={{ top: 12, right: 12 }}
          onClick={dismissAd}
          title="Close ad"
        >
          <FaTimes />
        </button>

        <div className="badge bg-secondary mb-2">Advertisement</div>
        <img
          src={iQoo}
          alt="Advertisement"
          className="rounded mb-3 w-100"
          style={{ maxHeight: 180, objectFit: 'contain', backgroundColor: '#1a1a1a' }}
        />
        <h5 className="fw-bold mb-2">Tired of interruptions?</h5>
        <p className="text-sp mb-4">
          Upgrade to Premium for uninterrupted, ad-free listening and offline downloads — just ₹99/month.
        </p>

        <div className="d-flex flex-column gap-2">
          <button className="btn btn-green" onClick={handleGoAdFree}>
            Go Ad-Free
          </button>
          <button className="btn btn-outline-light btn-sm" onClick={dismissAd}>
            Continue with ads
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdInterstitial