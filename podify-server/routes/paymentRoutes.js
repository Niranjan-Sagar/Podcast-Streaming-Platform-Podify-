import express from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Lazily created on first use, not at import time — by request time,
// dotenv.config() in server.js has already run and process.env is populated.
// Creating this at module load time (like before) would run before dotenv
// finishes, since ES module imports always execute before other top-level code.
let razorpay = null
function getRazorpayInstance() {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return razorpay
}

// Plan prices in paise (Razorpay works in the smallest currency unit — paise, not rupees)
// Price in paise (Razorpay works in the smallest currency unit — paise, not rupees)
const PLAN_PRICE = 9900 // ₹99

// POST /api/payments/create-order — creates a Razorpay order for the chosen plan
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const order = await getRazorpayInstance().orders.create({
      amount: PLAN_PRICE,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId: req.user.id,
      },
    })

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to create order', error: err.message })
  }
})

// POST /api/payments/verify — verifies the payment signature and upgrades the user to premium
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' })
    }

    // This is the step that actually proves the payment is genuine — anyone
    // can call this route with fake IDs, but only Razorpay's secret key can
    // produce a signature that matches. Without this check, someone could
    // fake a "successful payment" just by calling this endpoint directly.
    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Signature mismatch.' })
    }

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.isPremium = true
    await user.save()

    res.json({ message: 'Payment verified. Premium activated.', isPremium: true })
  } catch (err) {
    res.status(500).json({ message: 'Payment verification error', error: err.message })
  }
})

export default router