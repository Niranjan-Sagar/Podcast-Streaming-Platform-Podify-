import mongoose from 'mongoose'

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  timestamp: { type: String, required: true } // e.g., "05:24"
})

const episodeSchema = new mongoose.Schema({
  podcastId: { type: mongoose.Schema.Types.ObjectId, ref: 'Podcast', required: true },
  title: { type: String, required: true },
  description: { type: String },
  
  // Cloud Storage & Streaming (Ready for AWS & HLS.js)
  audioUrl: { type: String, required: true }, // Will hold S3 or HLS Master Playlist URL
  duration: { type: Number, default: 0 }, // In seconds
  sizeInBytes: { type: Number }, // Required for offline download limits
  
  // Advanced Features
  chapters: [chapterSchema],
  transcriptUrl: { type: String }, // Link to generated text file
  guestProfiles: [{ name: String, bio: String, socialLink: String }],
  
  // Analytics
 playCount: { type: Number, default: 0 },
completionRate: { type: Number, default: 0 },
downloadCount: { type: Number, default: 0 } // Percentage of users who finish the episode
}, { timestamps: true })

export default mongoose.model('Episode', episodeSchema)