import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { projectId, publicAnonKey } from '../src/utils/supabase/info'

const Home = dynamic(() => import('../src/pages/Home'), {
  loading: () => <div>Loading...</div>
})

export default function HomePage() {
  // Initialize database in background (non-blocking)
  useEffect(() => {
    initializeDatabase()
  }, [])

  async function initializeDatabase() {
    try {
      const response = await fetch('/api/init-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      console.log('Database initialization:', data)
    } catch (error) {
      console.error('Database initialization error:', error)
    }
  }

  return <Home />
}
