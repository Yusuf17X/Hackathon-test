import { useState, useEffect } from 'react'

function App() {
  const [apiStatus, setApiStatus] = useState('Checking...')

  useEffect(() => {
    // Test API connection
    fetch('/api/v1/schools')
      .then(response => response.json())
      .then(() => setApiStatus('✓ Backend Connected'))
      .catch(() => setApiStatus('✗ Backend Not Connected'))
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Hackathon App</h1>
      <p>Frontend: ✓ Running</p>
      <p>Backend: {apiStatus}</p>
      <p>This is a placeholder frontend. Add your Lovable/React components here.</p>
    </div>
  )
}

export default App
