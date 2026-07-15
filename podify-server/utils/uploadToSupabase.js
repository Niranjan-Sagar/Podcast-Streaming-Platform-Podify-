import { getSupabase, BUCKET_NAME } from '../config/supabase.js'

// Uploads a Multer memory-buffer file to Supabase Storage under the given
// folder, and returns the full public URL to store in MongoDB.
export async function uploadToSupabase(file, folder) {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
  const ext = file.originalname.split('.').pop()
  const path = `${folder}/${unique}.${ext}`

  const { error } = await getSupabase().storage
    .from(BUCKET_NAME)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (error) throw new Error(`Supabase upload failed: ${error.message}`)

  const { data } = getSupabase().storage.from(BUCKET_NAME).getPublicUrl(path)
  return data.publicUrl
}

// Deletes a file from Supabase Storage given its full public URL —
// used when replacing a cover image/audio file on edit, or deleting a podcast/episode.
export async function deleteFromSupabase(publicUrl) {
  if (!publicUrl) return
  try {
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return
    const path = publicUrl.slice(idx + marker.length)
    await getSupabase().storage.from(BUCKET_NAME).remove([path])
  } catch (err) {
    console.error('Failed to delete old file from Supabase:', err.message)
  }
}