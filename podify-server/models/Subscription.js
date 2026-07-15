import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    podcast: { type: mongoose.Schema.Types.ObjectId, ref: 'Podcast', required: true },
  },
  { timestamps: true }
)

// prevents the same user subscribing to the same podcast twice
subscriptionSchema.index({ user: 1, podcast: 1 }, { unique: true })

export default mongoose.model('Subscription', subscriptionSchema)
