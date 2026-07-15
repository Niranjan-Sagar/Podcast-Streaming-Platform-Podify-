import express from 'express'
import User from '../models/User.js'
import Episode from '../models/Episode.js'
import Podcast from '../models/Podcast.js'
import { requireAuth } from '../middleware/auth.js'
import { upload } from '../config/upload.js'
import { uploadToSupabase, deleteFromSupabase } from '../utils/uploadToSupabase.js'
const router = express.Router()
// GET /api/users/profile — fetch the logged-in user's full profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message })
  }
})

// PATCH /api/users/profile — edit name, country, ageGroup, bio, and optionally replace profile image
router.patch('/profile', requireAuth, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const { name, country, ageGroup, bio } = req.body
    if (name) user.name = name
    if (country) user.country = country
    if (ageGroup) user.ageGroup = ageGroup
    if (bio !== undefined) user.bio = bio

    if (req.file) {
      const oldProfileImage = user.profileImage
      user.profileImage = await uploadToSupabase(req.file, 'profiles')
      await deleteFromSupabase(oldProfileImage)
    }

    await user.save()
    const { password, ...safeUser } = user.toObject()
    res.json(safeUser)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message })
  }
})
// POST /api/users/history — Logs play history to the database
router.post('/history', requireAuth, async (req, res) => {
    try {
        const { episodeId, progressInSeconds, completed } = req.body;

        const user = await User.findById(req.user.id);
        const episode = await Episode.findById(episodeId);

        if (!user || !episode) return res.status(404).json({ message: 'Not found' });

        // Update global episode analytics (For the Creator Dashboard later)
        if (completed) {
            episode.playCount += 1;
            // Basic completion rate math (can be refined)
            episode.completionRate = ((episode.completionRate * (episode.playCount - 1)) + 100) / episode.playCount;

            const podcast = await Podcast.findById(episode.podcastId);
            if (podcast) {
                podcast.totalPlays += 1;
                await podcast.save();
            }
        }
        await episode.save();

        // Check if user already has history for this episode
        const historyIndex = user.playHistory.findIndex(h => h.episodeId.toString() === episodeId);

        if (historyIndex > -1) {
            // Update existing history
            user.playHistory[historyIndex].progressInSeconds = progressInSeconds;
            user.playHistory[historyIndex].lastPlayedAt = Date.now();
        } else {
            // Add new history record
            user.playHistory.push({
                episodeId,
                progressInSeconds,
                lastPlayedAt: Date.now()
            });
        }

        await user.save();
        res.status(200).json({ message: 'History logged successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Failed to log history', error: error.message });
    }
});
// GET /api/users/history — fetch logged-in user's play history, most recent first
router.get('/history', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'playHistory.episodeId',
      populate: { path: 'podcastId', select: 'title coverImage category language' }
    })
    const sorted = [...user.playHistory]
      .filter(h => h.episodeId) // drop entries where the episode was later deleted
      .sort((a, b) => new Date(b.lastPlayedAt) - new Date(a.lastPlayedAt))
    res.json(sorted)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch history' })
  }
})
// GET /api/users/library — Fetches the user's saved episodes
router.get('/library', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'savedEpisodes',
            populate: { path: 'podcastId', select: 'title coverImage creator' }
        });
        res.json(user.savedEpisodes);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch library' });
    }
});

// POST /api/users/library/:episodeId — Toggles an episode in the library
router.post('/library/:episodeId', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const episodeId = req.params.episodeId;

        if (!user.savedEpisodes.includes(episodeId)) {
            user.savedEpisodes.push(episodeId);
            await user.save();
        }
        res.status(200).json({ message: 'Added to library' });
    } catch (error) {

        res.status(500).json({ message: 'Failed to update library' });
    }
});

// DELETE /api/users/library/:episodeId — Removes from library
router.delete('/library/:episodeId', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.savedEpisodes = user.savedEpisodes.filter(id => id.toString() !== req.params.episodeId);
        await user.save();
        res.status(200).json({ message: 'Removed from library' });
    } catch (error) {

        res.status(500).json({ message: 'Failed to update library' });
    }
});

// GET /api/users/notifications — fetch logged-in user's notifications, newest first
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications')
    const sorted = [...user.notifications].sort((a, b) => new Date(b.date) - new Date(a.date))
    res.json(sorted)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch notifications' })
  }
})

// PATCH /api/users/notifications/read — mark all as read
router.patch('/notifications/read', requireAuth, async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user.id },
      { $set: { 'notifications.$[].isRead': true } }
    )
    res.json({ message: 'Marked as read' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update notifications' })
  }
})
export default router;