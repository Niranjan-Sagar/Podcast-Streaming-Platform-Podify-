import multer from 'multer'

// Files are held in memory as buffers, then uploaded to Supabase Storage
// by the route handler — nothing is written to local disk anymore.
const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  if (file.fieldname === 'audioFile') {
    if (!file.mimetype.startsWith('audio/')) {
      return cb(new Error('Only audio files are allowed for episodes'), false)
    }
  }
  if (file.fieldname === 'coverImage' || file.fieldname === 'profileImage') {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false)
    }
  }
  cb(null, true)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB cap per file
})