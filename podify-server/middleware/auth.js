import jwt from 'jsonwebtoken'

// Verifies the JWT sent in the Authorization header, attaches user info to req.user
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // { id, role }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Extra check for creator-only routes (uploading/managing episodes)
export function requireCreator(req, res, next) {
  if (req.user.role !== 'creator') {
    return res.status(403).json({ message: 'Creator account required for this action' })
  }
  next()
}
