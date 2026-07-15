import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/api'

function Premium() {
  const { user, token, updateUser } = useAuth()
  const [processing, setProcessing] = useState(false)

  const handleUpgrade = async () => {
    if (!user) {
      toast.info('Please log in to upgrade to Premium.')
      return
    }
    if (user.isPremium) {
      toast.info("You're already a Premium member.")
      return
    }

    setProcessing(true)
    try {
      const orderRes = await fetch(`${API_BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!orderRes.ok) throw new Error('Failed to start payment')
      const order = await orderRes.json()

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Podify',
        description: 'Premium Plan Subscription',
        order_id: order.orderId,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verifyData.message || 'Verification failed')

            updateUser({ isPremium: true })
            toast.success('Welcome to Premium! Ads removed, downloads unlocked.')
          } catch (err) {
            toast.error(err.message || 'Payment verification failed')
          } finally {
            setProcessing(false)
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: '#1ed760' },
      }

      const razorpayInstance = new window.Razorpay(options)
      razorpayInstance.open()
    } catch (error) {
      toast.error(error.message || 'Something went wrong')
      setProcessing(false)
    }
  }

  return (
    <div className="container py-4">
      <h2 className="text-center mb-2">Go Premium</h2>
      <p className="text-center text-sp mb-5">Unlock ad-free listening and offline downloads.</p>

      {user?.isPremium && (
        <div className="alert alert-success text-center mb-4">
          You're a Premium member. Enjoy ad-free listening and offline downloads!
        </div>
      )}

      <div className="row row-cols-1 row-cols-md-2 g-4 mb-5 justify-content-center">
        <div className="col">
          <div className="card bg-body-secondary h-100 text-center">
            <div className="card-body">
              <h4>Free</h4>
              <h2 className="my-3">₹0<span className="fs-6 text-sp">/month</span></h2>
              <p className="text-sp">Basic access with ads, no offline downloads</p>
              <button className="btn btn-outline-secondary w-100 mt-3" disabled>
                Current Plan
              </button>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card bg-body-secondary h-100 text-center border-success border-2 position-relative">
            <span className="badge bg-success position-absolute top-0 start-50 translate-middle">Recommended</span>
            <div className="card-body">
              <h4>Premium</h4>
              <h2 className="my-3">₹99<span className="fs-6 text-sp">/month</span></h2>
              <p className="text-sp">Ad-free listening + offline downloads</p>
              <button
                className="btn btn-green w-100 mt-3"
                onClick={handleUpgrade}
                disabled={processing || user?.isPremium}
              >
                {processing ? 'Processing...' : user?.isPremium ? 'Active' : 'Upgrade Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <h4 className="mb-3">Compare Features</h4>
      <div className="table-responsive">
        <table className="table table-bordered text-center align-middle">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Free</th>
              <th>Premium</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Ad-free listening</td><td>❌</td><td>✅</td></tr>
            <tr><td>Offline downloads</td><td>❌</td><td>✅</td></tr>
            <tr><td>Personalised feed</td><td>✅</td><td>✅</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Premium