import { useState } from 'react'
import { toast } from 'react-toastify'

// Formcarry endpoint — replace with YOUR OWN form's URL from formcarry.com.
// This is what routes submissions straight to your inbox. Without a real
// endpoint here, this will fail every time (it's currently a placeholder).
const FORMCARRY_ENDPOINT = 'https://formcarry.com/s/C7JpcgvurCH'

function Support() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !message) {
      toast.error('Please fill all fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(FORMCARRY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      })
      const data = await res.json()

      if (res.ok && data.code === 200) {
        toast.success('Your request has been submitted!')
        setName('')
        setEmail('')
        setMessage('')
      } else {
        // Formcarry returns 422 with field errors, or other codes on failure
        toast.error(data.message || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      toast.error('Could not reach the server. Check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-4">
      <h2 className="text-center mb-2">Support Center</h2>
      <p className="text-center text-sp mb-5">Browse FAQs or reach out to us directly.</p>
      <div className="row">
        <div className="col-md-7 mb-4">
          <h5 className="mb-3">Frequently Asked Questions</h5>
          <div className="accordion" id="faqAccordion">
            {[
              { id: 'faq1', q: 'How do I create a Podify account?', a: 'Click Sign up in the navbar and fill in your details.' },
              { id: 'faq2', q: 'How do I upload a podcast?', a: 'Login as a creator and use the Upload Episode option.' },
              { id: 'faq3', q: 'What is included in Premium?', a: 'Premium removes ads and unlocks offline downloads and high quality audio.' },
              { id: 'faq4', q: 'How do I reset my password?', a: 'Click Forgot Password on the Login page and follow the steps.' },
            ].map(item => (
              <div className="accordion-item" key={item.id}>
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#${item.id}`}>
                    {item.q}
                  </button>
                </h2>
                <div id={item.id} className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div className="accordion-body text-sp">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-md-5">
          <h5 className="mb-3">Contact Us</h5>
          <div className="card bg-body-secondary p-3 border-0">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control form-sp" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control form-sp" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Message</label>
                  <textarea className="form-control form-sp" rows="4" placeholder="Describe your issue" value={message} onChange={e => setMessage(e.target.value)}></textarea>
                </div>
                <button type="submit" className="btn btn-green w-100" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Submit Request'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Support
