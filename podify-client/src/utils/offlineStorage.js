const DB_NAME = 'podify-offline'
const STORE_NAME = 'episodes'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Downloads the audio file and stores it as a blob, tagged with which user owns it
export async function saveEpisodeOffline(episode, userId) {
  const response = await fetch(episode.audio)
  const blob = await response.blob()

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({
      id: `${userId}-${episode.id}`,
      episodeId: episode.id,
      userId,
      title: episode.title,
      creator: episode.creator,
      img: episode.img,
      blob,
      savedAt: Date.now(),
    })
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getOfflineEpisode(episodeId, userId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(`${userId}-${episodeId}`)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllOfflineEpisodes(userId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => {
      const all = request.result || []
      resolve(all.filter(ep => ep.userId === userId))
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteEpisodeOffline(episodeId, userId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(`${userId}-${episodeId}`)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function isEpisodeOffline(episodeId, userId) {
  const episode = await getOfflineEpisode(episodeId, userId)
  return !!episode
}