import { manager } from '../../../pty/manager.js'
import { JsonResponse } from './responses.ts'
import type { HealthResponse } from '../../shared/types.ts'

export function handleHealth(server: { pendingWebSockets?: number }) {
  const sessions = manager.list()
  const activeSessions = sessions.filter((s) => s.status === 'running').length
  const totalSessions = sessions.length

  // Calculate response time (rough approximation)
  const startTime = Date.now()

  const healthResponse: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0,
    sessions: {
      total: totalSessions,
      active: activeSessions,
    },
    websocket: {
      connections: server.pendingWebSockets || 0,
    },
    memory: process.memoryUsage
      ? {
          rss: process.memoryUsage().rss,
          heapUsed: process.memoryUsage().heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
        }
      : undefined,
  }

  // Add response time
  const responseTime = Date.now() - startTime
  healthResponse.responseTime = responseTime

  return new JsonResponse(healthResponse)
}
