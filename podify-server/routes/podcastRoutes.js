import express from 'express'
import Podcast from '../models/Podcast.js'
import Episode from '../models/Episode.js'
import { requireAuth, requireCreator } from '../middleware/auth.js'
import { upload } from '../config/upload.js'
import { uploadToSupabase, deleteFromSupabase } from '../utils/uploadToSupabase.js'
const router = express.Router()


function escapeXml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
// 1. ADVANCED SEARCH
// GET /api/podcasts/search 
router.get('/search', async (req, res) => {
  try {
    const { keyword, category, language, sortBy, page = 1, limit = 8 } = req.query;
    let query = {};

    if (keyword) {
      // Find creators whose NAME matches, so searching a host's name works too
      const User = (await import('../models/User.js')).default
      const matchingCreators = await User.find({ name: { $regex: keyword, $options: 'i' } }).select('_id')
      const matchingCreatorIds = matchingCreators.map(u => u._id)

      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { creator: { $in: matchingCreatorIds } },
      ];
    }
    if (category && category !== 'All') query.category = category;
    if (language && language !== 'All') query.language = language;

    let sortOption = { createdAt: -1 };
    if (sortBy === 'popularity') sortOption = { subscriberCount: -1, totalPlays: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const podcasts = await Podcast.find(query).populate('creator', 'name profileImage').sort(sortOption).skip(skip).limit(Number(limit));
    res.json(podcasts);
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// 2. CREATOR DASHBOARD LIST (MUST BE ABOVE /:id)
// GET /api/podcasts/mine/list 
router.get('/mine/list', requireAuth, requireCreator, async (req, res) => {
  try {
    const podcasts = await Podcast.find({ creator: req.user.id }).sort({ createdAt: -1 })
    res.json(podcasts)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your podcasts', error: err.message })
  }
})

// 3. THE MISSING HOME ROUTE
// GET /api/podcasts — Fetch all for the homepage feed
router.get('/', async (req, res) => {
  try {
    const podcasts = await Podcast.find().populate('creator', 'name profileImage').sort({ createdAt: -1 });
    res.json(podcasts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch podcasts', error: error.message });
  }
});

// GET /api/podcasts/:id/rss.xml — public RSS 2.0 feed, satisfies "auto-distribution via RSS" requirement
router.get('/:id/rss.xml', async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id).populate('creator', 'name profileImage')
    if (!podcast) return res.status(404).json({ message: 'Podcast not found' })

    const episodes = await Episode.find({ podcastId: podcast._id }).sort({ createdAt: -1 })
    const siteUrl = `${req.protocol}://${req.get('host')}`

    const items = episodes.map(ep => `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${escapeXml(ep.description || '')}</description>
      <enclosure url="${ep.audioUrl.startsWith('http') ? ep.audioUrl : siteUrl + ep.audioUrl}" type="audio/mpeg" />
      <guid isPermaLink="false">${ep._id}</guid>
      <pubDate>${new Date(ep.createdAt).toUTCString()}</pubDate>
    </item>`).join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${escapeXml(podcast.title)}</title>
    <description>${escapeXml(podcast.description || '')}</description>
    <language>${escapeXml(podcast.language || 'en')}</language>
    <itunes:author>${escapeXml(podcast.creator?.name || 'Unknown')}</itunes:author>
    <itunes:category text="${escapeXml(podcast.category)}" />
    ${podcast.coverImage ? `<itunes:image href="${podcast.coverImage.startsWith('http') ? podcast.coverImage : siteUrl + podcast.coverImage}" />` : ''}
    ${items}
  </channel>
</rss>`

    res.set('Content-Type', 'application/rss+xml')
    res.send(xml)
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate RSS feed', error: err.message })
  }
})

// GET /api/podcasts/:id/demographics — creator-only, subscriber breakdown by country and age group
router.get('/:id/demographics', requireAuth, requireCreator, async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id)
    if (!podcast) return res.status(404).json({ message: 'Podcast not found' })
    if (podcast.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this podcast' })
    }

    const Subscription = (await import('../models/Subscription.js')).default
    const User = (await import('../models/User.js')).default

    const subs = await Subscription.find({ podcast: req.params.id }).select('user')
    const userIds = subs.map(s => s.user)

    if (userIds.length === 0) {
      return res.json({ totalSubscribers: 0, byCountry: [], byAgeGroup: [] })
    }

    const listeners = await User.find({ _id: { $in: userIds } }).select('country ageGroup')

    const countryCounts = {}
    const ageGroupCounts = {}
    listeners.forEach(u => {
      const country = u.country || 'Not specified'
      const age = u.ageGroup || 'Not specified'
      countryCounts[country] = (countryCounts[country] || 0) + 1
      ageGroupCounts[age] = (ageGroupCounts[age] || 0) + 1
    })

    const byCountry = Object.entries(countryCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)

    const byAgeGroup = Object.entries(ageGroupCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)

    res.json({ totalSubscribers: listeners.length, byCountry, byAgeGroup })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch demographics', error: err.message })
  }
})
// 4. GET SINGLE PODCAST (Dynamic route placed safely at the bottom)
// GET /api/podcasts/:id 
router.get('/:id', async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id).populate('creator', 'name email')
    if (!podcast) return res.status(404).json({ message: 'Podcast not found' })

    // Fixed to match the 'podcastId' field in the new Master Schema
    const episodes = await Episode.find({ podcastId: podcast._id }).sort({ createdAt: -1 })
    res.json({ podcast, episodes })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch podcast', error: err.message })
  }
})

// 5. CREATE NEW PODCAST
// POST /api/podcasts 
router.post('/', requireAuth, requireCreator, upload.single('coverImage'), async (req, res) => {
  try {
    const { title, description, category, language } = req.body
    if (!title || !category) return res.status(400).json({ message: 'Title and category are required' })

    let coverImageUrl = ''
    if (req.file) {
      coverImageUrl = await uploadToSupabase(req.file, 'covers')
    }

    const podcast = await Podcast.create({
      title,
      description,
      category,
      language: language || 'English',
      coverImage: coverImageUrl,
      creator: req.user.id,
    })
    podcast.rssFeedUrl = `${req.protocol}://${req.get('host')}/api/podcasts/${podcast._id}/rss.xml`
    await podcast.save()

    res.status(201).json(podcast)
  } catch (err) {
    res.status(500).json({ message: 'Failed to create podcast', error: err.message })
  }
})
// PATCH /api/podcasts/:id — creator-only, edit metadata and optionally replace cover image
// PATCH /api/episodes/:id — creator-only, edit title/description and optionally replace audio file
// PATCH /api/podcasts/:id — creator-only, edit metadata and optionally replace cover image
router.patch('/:id', requireAuth, requireCreator, upload.single('coverImage'), async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id)
    if (!podcast) return res.status(404).json({ message: 'Podcast not found' })
    if (podcast.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this podcast' })
    }

    const { title, description, category, language } = req.body
    if (title) podcast.title = title
    if (description !== undefined) podcast.description = description
    if (category) podcast.category = category
    if (language) podcast.language = language

    if (req.file) {
      const oldCoverImage = podcast.coverImage
      podcast.coverImage = await uploadToSupabase(req.file, 'covers')
      await deleteFromSupabase(oldCoverImage)
    }

    await podcast.save()
    res.json(podcast)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update podcast', error: err.message })
  }
})
// 6. DELETE PODCAST
// DELETE /api/podcasts/:id 
router.delete('/:id', requireAuth, requireCreator, async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.params.id)
    if (!podcast) return res.status(404).json({ message: 'Podcast not found' })
    if (podcast.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this podcast' })
    }

    const episodesToDelete = await Episode.find({ podcastId: podcast._id })
    for (const ep of episodesToDelete) {
      await deleteFromSupabase(ep.audioUrl)
    }
    await deleteFromSupabase(podcast.coverImage)

    await podcast.deleteOne()
    await Episode.deleteMany({ podcastId: podcast._id })
    res.json({ message: 'Podcast deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete podcast', error: err.message })
  }
})

export default router