import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'

const router = express.Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// POST /api/auth/google
// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential, role } = req.body

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const { email, name } = payload

    let user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // User doesn't exist, create a new one
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
      const hashedPassword = await bcrypt.hash(randomPassword, 10)

      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'listener',
      })
    } else if (user.role === 'listener' && role === 'creator') {
      // FIX: If the user exists as a listener but wants to be a creator, upgrade them!
      user.role = 'creator'
      await user.save()
    }

    const token = generateToken(user)
    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    res.status(401).json({ message: 'Google authentication failed', error: err.message })
  }
})


router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Find the user but don't send the password back
    const user = await User.findById(decoded.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, profileImage: user.profileImage })
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
})
// POST /api/auth/register (Standard Email Signup)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, country, ageGroup } = req.body;

    // 1. Check for missing fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // 3. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === 'creator' ? 'creator' : 'listener',
      country: country || 'Not specified',
      ageGroup: ageGroup || 'Not specified',
    });

    // 5. Generate token and send success
    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, profileImage: user.profileImage } });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed inside server', error: err.message });
  }
});

// POST /api/auth/login (Standard Email Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check for missing fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 2. Check if the email exists in the database
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // We send 401 (Unauthorized)
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Compare the typed password with the hashed database password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // We send 401 (Unauthorized)
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. If everything matches, generate token and log them in
    const token = generateToken(user);
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, profileImage: user.profileImage } });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

export default router