import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['listener', 'creator'], default: 'listener' },
  
  // Demographics for Creator Analytics
  country: { type: String, default: 'Not specified' },
  ageGroup: { type: String, default: 'Not specified' },
  profileImage: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 300 },
  
  // Library & Subscriptions
  savedEpisodes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Episode' }],
  subscribedPodcasts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Podcast' }],
  
  // NEW: Play History (For Recommendations & Resuming audio)
  playHistory: [{
    episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Episode' },
    progressInSeconds: { type: Number, default: 0 },
    lastPlayedAt: { type: Date, default: Date.now }
  }],

  // NEW: Notifications (For new episode alerts)
  notifications: [{
    message: { type: String },
    isRead: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
  }],
  
  // Monetization (Stripe)
 stripeCustomerId: { type: String }, 
  stripeAccountId: { type: String },  
  isPremium: { type: Boolean, default: false }
}, { timestamps: true })

export default mongoose.model('User', userSchema)