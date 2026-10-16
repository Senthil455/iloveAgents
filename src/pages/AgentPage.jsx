import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import AgentRunner from '../components/AgentRunner'
import NotFoundPage from './NotFoundPage'
import { useAgents } from '../lib/useAgents'
import { useDocumentTitle } from '../lib/useDocumentTitle'

function readRecentIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem('recentAgents') || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function AgentPage() {
  const { id } = useParams()
  const { agents, loading: isLoading } = useAgents()

  const agent = agents.find((a) => a.id === id)
  useDocumentTitle(agent?.name ?? 'Agent Not Found')

  useEffect(() => {
    if (!agent) return

    const existing = readRecentIds()

    const updated = [
      agent.id,
      ...existing.filter((item) => item !== agent.id),
    ].slice(0, 5)

    try {
      localStorage.setItem(
        'recentAgents',
        JSON.stringify(updated)
      )
    } catch {
      // storage full or unavailable, recent list is best effort
    }
  }, [agent])

  if (isLoading) {
    return null
  }

  if (!agent) {
    return <NotFoundPage />
  }

  // Use key to force remount when switching agents
  return <AgentRunner key={agent.id} agent={agent} />
}
