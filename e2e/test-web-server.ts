import { manager } from '../src/pty/manager.js'
import { PTYServer } from '../src/web/server/server.js'

// Create and start server
const server = await PTYServer.createServer()

// Write server URL to file for tests to read
if (process.env.NODE_ENV === 'test') {
  const workerIndex = process.env.TEST_WORKER_INDEX || '0'
  if (!server.server.url) {
    throw new Error('Server URL not available')
  }
  await Bun.write(`/tmp/test-server-port-${workerIndex}.txt`, server.server.url.href)
}

// Health check for test mode
if (process.env.NODE_ENV === 'test') {
  try {
    const response = await fetch(`${server.server.url}/api/sessions`)
    if (!response.ok) {
      console.error('Server health check failed')
      process.exit(1)
    }
  } catch (error) {
    console.error('Server health check failed:', error)
    process.exit(1)
  }
}
