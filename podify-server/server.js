import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import podcastRoutes from './routes/podcastRoutes.js'
import episodeRoutes from './routes/episodeRoutes.js'
import subscriptionRoutes from './routes/subscriptionRoutes.js'
import userRoutes from './routes/userRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(cors())
app.use(express.json())

// Serves uploaded audio/cover files directly, e.g. http://localhost:5000/uploads/episodes/xyz.mp3
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes)
app.use('/api/podcasts', podcastRoutes)
app.use('/api/episodes', episodeRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/payments', paymentRoutes)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
})
