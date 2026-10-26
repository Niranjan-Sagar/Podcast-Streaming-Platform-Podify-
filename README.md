# Podify - Podcast Streaming Platform

Live: https://podcast-streaming-platform-podify.vercel.app/

A MERN stack podcast platform where creators upload podcasts and listeners can stream, subscribe, download and pay for premium.

## Features
- Audio streaming with HLS.js
- Offline downloads using IndexedDB
- Subscribe to podcasts and get a feed of new episodes
- Premium access with Razorpay (one-time ₹99 payment)
- Google login
- Creator dashboard with analytics
- File storage on Supabase

## Tech Stack
React, Node.js, Express, MongoDB, HLS.js, Supabase, Razorpay, Google OAuth, Bootstrap 5
Frontend on Vercel, backend on Render.

## How payment verification works
1. Logged-in user clicks upgrade. The frontend calls `POST /api/payments/create-order`.
2. The server creates a Razorpay order for ₹99 (price is set on the server, not the frontend) and sends back the order id.
3. User pays in the Razorpay popup. Razorpay gives back a payment id and a signature.
4. The frontend sends these to `POST /api/payments/verify`.
5. The server makes its own signature from `order_id|payment_id` using the secret key, and compares it with the one received.
6. Only if they match, the server sets `isPremium = true` for that user.

The secret key is only on the server, so a user cannot fake a payment by calling the route directly.

## How login sessions work
After Google login, the server gives the user its own JWT. Protected routes check this token in `requireAuth`. If the token is expired or invalid, the server returns 401 and the user has to log in again. [Add what your frontend does on 401 and how long the token lasts.]

## Known limitations
- Premium is a one-time upgrade and does not expire.
- No webhook yet, so if a user closes the page right after paying, premium may not activate.

## Run locally
[Add your steps and .env variable names, names only.]
