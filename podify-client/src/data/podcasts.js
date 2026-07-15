// Central podcast dataset.
// NOTE: images use picsum.photos (license-free placeholders) instead of
// real creators' photos / Spotify CDN art — swap these for your own
// artwork before you submit/deploy this project.
// audio uses SoundHelix's free demo mp3s so the player actually works
// end-to-end. Replace with your real episode files later.
import Raj from '../assets/Raj.png'
import Hack from '../assets/Hack.png'
import Jay from '../assets/Jay.png'
import Prakhar from '../assets/Prakhar.png'
import Ranveer from '../assets/Ranveer.png'
import prakhar2 from '../assets/prakhar2.png'
import Real from '../assets/Real.png'
import Elon from '../assets/Elon.png'
import shamani from '../assets/shamani.jpg'
import sheety from '../assets/sheety.jpg'
import hit from '../assets/hit.jpg'
import allahbadia from '../assets/allahbadia.jpg'
import gupta from '../assets/gupta.jpg'

const podcasts = [
  {
  id: 1,
  title: "Billionaire's Brain vs Your Brain",
  creator: "Raj Shamani",
  category: "Business",
  subscriberCount: 4200,
  img: Raj,
  audio: "/rajaudio.mp3",
  duration: 225,
},
{
  id: 2,
  title: "Change Your Brain: Neuroscientist Dr. Andrew Huberman",
  creator: "Rich Roll",
  category: "Health & Fitness",
  subscriberCount: 3100,
  img: Hack,
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  duration: 258,
},
{
  id: 3,
  title: "TOM HOLLAND: How Tom Overcame Social Anxiety-",
  creator: "Jay Shetty Podcast",
  category: "Health & Fitness",
  subscriberCount: 5600,
  img: Jay,
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  duration: 214,
},
{
  id: 4,
  title: "Amit Kilhor Exposes The Darkest Truths About How India Really Works",
  creator: "Prakhar Gupta and amit kilhor",
  category: "Education",
  subscriberCount: 2800,
  img: Prakhar,
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  duration: 240,
},
{
  id: 5,
  title: "BRAVEST INDIAN KING : Chhatrapati Shivaji Maharaj's Legacy I Ashish B On TRS",
  creator: "Ranveer Allahbadia and Ashish Bharatvanshi",
  category: "Education",
  subscriberCount: 6100,
  img: Ranveer,
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  duration: 232,
},
{
  id: 6,
  title: "I Flew A Real Pakistani Ter*orist To My Podcast Studio",
  creator: "Prakhar Gupta",
  category: "Comedy",
  subscriberCount: 1900,
  img: prakhar2,
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  duration: 198,
},
{
  id: 7,
  title: "Detained in China, Solo Travels Experiences in Vietnam & Japan",
  creator: "RealHit",
  category: "Comedy",
  subscriberCount: 3400,
  img: Real,
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  duration: 265,
},
{
  id: 8,
  title: "Elon Musk: A Different Conversation | Full Episode | People by WTF Ep. 16",
  creator: "Nikhil Kamath",
  category: "Technology",
  subscriberCount: 8900,
  img: Elon,
  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  duration: 210,
},
]

export const creators = [
  { name: "Raj Shamani", img: shamani },
  { name: "Ranveer Allahbadia", img: "https://media.licdn.com/dms/image/v2/D5603AQGlosHMDk-kwg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1730171107969?e=2147483647&v=beta&t=JjvBV0xZbnAT3K5dKeo-GaXQ7YG6lETvVgWDcIC-3mo" },
  { name: "Real Hit", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYwV8SURV0Ox67g9MUrRbVf4N-mAuE3TnIs81ziR-nJA&s=10" },
  { name: "Jay Shetty", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgufGm3SUr6b1IQBegSFk_bBCREJsrVUgUJ-TYDF8J5w&s=10" },
  { name: "Prakhar Gupta", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi42ChvK7k1YSiMFfcYAywSkp1uX9FQXQw48iN1g3GTw&s=10https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSWCrsz-DNOvRbjtRKqIZ3gSeclaBM8_zNwZl6wY6rEw&s=10" },
]

export default podcasts
