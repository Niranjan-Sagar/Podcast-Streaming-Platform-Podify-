import express from 'express'
import Subscription from '../models/Subscription.js'
import Podcast from '../models/Podcast.js'
import Episode from '../models/Episode.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// POST /api/subscriptions/:podcastId — subscribe the logged-in listener to a podcast
router.post('/:podcastId', requireAuth, async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.podcastId)
    if (!podcast) return res.status(404).json({ message: 'Podcast not found' })

    const existing = await Subscription.findOne({ user: req.user.id, podcast: req.params.podcastId })
    if (existing) return res.status(409).json({ message: 'Already subscribed' })

    await Subscription.create({ user: req.user.id, podcast: req.params.podcastId })
    podcast.subscriberCount += 1
    await podcast.save()

    res.status(201).json({ message: 'Subscribed' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to subscribe', error: err.message })
  }
})

// DELETE /api/subscriptions/:podcastId — unsubscribe
router.delete('/:podcastId', requireAuth, async (req, res) => {
  try {
    const result = await Subscription.findOneAndDelete({ user: req.user.id, podcast: req.params.podcastId })
    if (!result) return res.status(404).json({ message: 'Subscription not found' })

    const podcast = await Podcast.findById(req.params.podcastId)
    if (podcast && podcast.subscriberCount > 0) {
      podcast.subscriberCount -= 1
      await podcast.save()
    }

    res.json({ message: 'Unsubscribed' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to unsubscribe', error: err.message })
  }
})

// GET /api/subscriptions/mine — list of podcasts the logged-in user is subscribed to
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.user.id }).populate({
      path: 'podcast',
      populate: { path: 'creator', select: 'name profileImage' }
    })
    res.json(subs.map(s => s.podcast))
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subscriptions', error: err.message })
  }
})

// GET /api/subscriptions/feed — personalized feed: newest episodes from subscribed podcasts only
router.get('/feed', requireAuth, async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.user.id })
    const podcastIds = subs.map(s => s.podcast)

    if (podcastIds.length === 0) {
      return res.json([]) // no subscriptions yet — empty feed, frontend should show a prompt to subscribe
    }

    const episodes = await Episode.find({ podcastId: { $in: podcastIds } })
  .populate('podcastId', 'title category coverImage')
  .sort({ createdAt: -1 })
  .limit(50)

    res.json(episodes)
  } catch (err) {
    res.status(500).json({ message: 'Failed to build feed', error: err.message })
  }
})

export default router
