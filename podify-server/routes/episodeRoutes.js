import express from 'express'
import Episode from '../models/Episode.js'
import Podcast from '../models/Podcast.js'
import { requireAuth, requireCreator } from '../middleware/auth.js'
import { upload } from '../config/upload.js'
import { uploadToSupabase, deleteFromSupabase } from '../utils/uploadToSupabase.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
const router = express.Router()

// POST /api/episodes — creator-only, upload a new episode to one of their podcasts
router.post('/', requireAuth, requireCreator, upload.single('audioFile'), async (req, res) => {
  try {
    const { podcastId, title, description } = req.body
    if (!podcastId || !title || !req.file) {
      return res.status(400).json({ message: 'podcastId, title, and an audio file are required' })
    }

    const podcast = await Podcast.findById(podcastId)
    if (!podcast) return res.status(404).json({ message: 'Podcast not found' })
    if (podcast.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this podcast' })
    }

    const audioUrl = await uploadToSupabase(req.file, 'episodes')

    const episode = await Episode.create({
      podcastId: podcastId,
      title,
      description,
      audioUrl,
    })

    // Notify everyone subscribed to this podcast
    const subs = await Subscription.find({ podcast: podcastId })
    const subscriberIds = subs.map(s => s.user)
    if (subscriberIds.length > 0) {
      await User.updateMany(
        { _id: { $in: subscriberIds } },
        {
          $push: {
            notifications: {
              message: `New episode "${title}" from ${podcast.title}`,
              isRead: false,
              date: new Date(),
            }
          }
        }
      )
    }

    res.status(201).json(episode)
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload episode', error: err.message })
  }
})
// GET /api/episodes/podcast/:podcastId — creator-only, list all episodes for one of their podcasts
router.get('/podcast/:podcastId', requireAuth, requireCreator, async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.podcastId)
    if (!podcast) return res.status(404).json({ message: 'Podcast not found' })
    if (podcast.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this podcast' })
    }
    const episodes = await Episode.find({ podcastId: req.params.podcastId }).sort({ createdAt: -1 })
    res.json(episodes)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch episodes', error: err.message })
  }
})
// GET /api/episodes/:id — fetch single episode (used when loading into player)
router.get('/:id', async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id).populate('podcastId', 'title creator category')
    if (!episode) return res.status(404).json({ message: 'Episode not found' })
    res.json(episode)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch episode', error: err.message })
  }
})
// PATCH /api/episodes/:id/download — premium-only, increments download count when a listener saves an episode offline
router.patch('/:id/download', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('isPremium')
    if (!user || !user.isPremium) {
      return res.status(403).json({ message: 'Offline downloads are a Premium feature. Upgrade to continue.' })
    }

    const episode = await Episode.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    )
    if (!episode) return res.status(404).json({ message: 'Episode not found' })
    res.json({ downloadCount: episode.downloadCount })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update download count', error: err.message })
  }
})

// PATCH /api/episodes/:id/play — increments play count, called when playback starts (basic analytics)
router.patch('/:id/play', async (req, res) => {
  try {
    const episode = await Episode.findByIdAndUpdate(
      req.params.id,
      { $inc: { playCount: 1 } },
      { new: true }
    )
    if (!episode) return res.status(404).json({ message: 'Episode not found' })
    res.json({ playCount: episode.playCount })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update play count', error: err.message })
  }
})

// PATCH /api/episodes/:id — creator-only, edit title/description of an existing episode
// PATCH /api/episodes/:id — creator-only, edit title/description and optionally replace audio file
router.patch('/:id', requireAuth, requireCreator, upload.single('audioFile'), async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id).populate('podcastId')
    if (!episode) return res.status(404).json({ message: 'Episode not found' })
    if (episode.podcastId.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this episode' })
    }

    const { title, description } = req.body
    if (title) episode.title = title
    if (description !== undefined) episode.description = description

    if (req.file) {
      const oldAudioUrl = episode.audioUrl
      episode.audioUrl = await uploadToSupabase(req.file, 'episodes')
      await deleteFromSupabase(oldAudioUrl)
    }

    await episode.save()

    res.json(episode)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update episode', error: err.message })
  }
})
// DELETE /api/episodes/:id — creator-only, and only if they own the parent podcast
router.delete('/:id', requireAuth, requireCreator, async (req, res) => {
  try {
    const episode = await Episode.findById(req.params.id).populate('podcastId')
    if (!episode) return res.status(404).json({ message: 'Episode not found' })
    if (episode.podcastId.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this episode' })
    }
    await episode.deleteOne()
    res.json({ message: 'Episode deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete episode', error: err.message })
  }
})

export default router
