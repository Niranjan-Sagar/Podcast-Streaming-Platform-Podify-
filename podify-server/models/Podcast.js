import mongoose from 'mongoose'

const podcastSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  language: { type: String, default: 'English' },
  
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverImage: { type: String, required: true }, 
  
  // Analytics
  subscriberCount: { type: Number, default: 0 },
  totalPlays: { type: Number, default: 0 }, 
  
  // Monetization & Distribution
  isPremiumOnly: { type: Boolean, default: false },
  rssFeedUrl: { type: String }, 
  
  // NEW: Sponsorship Integration
  acceptsSponsors: { type: Boolean, default: false },
  sponsorshipPrice: { type: Number, default: 0 }
}, { timestamps: true })

export default mongoose.model('Podcast', podcastSchema)