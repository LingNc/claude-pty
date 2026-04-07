---
name: pty
description: |
  Manage PTY (pseudo-terminal) sessions in Claude Code. Use when user needs to:
  - Run long-running commands or interactive programs (pty_spawn)
  - Check output from a running terminal session (pty_read)
  - Send input to an interactive session like Ctrl+C (pty_write)
  - List all active terminal sessions (pty_list)
  - Stop/terminate a running session (pty_kill)
  
  Common use cases:
  - "Run npm dev server" → use pty_spawn
  - "Check the server output" → use pty_read
  - "Stop the server" → use pty_kill
  - "Send Ctrl+C to the process" → use pty_write
  - "List running terminals" → use pty_list
---

# PTY Terminal Management

## Available Tools

- **pty_spawn**: Create new terminal session with command
- **pty_read**: Read buffered output with optional pattern filter
- **pty_write**: Send input including special keys (Ctrl+C, etc.)
- **pty_list**: Show all active sessions
- **pty_kill**: Terminate session

## Workflow Examples

### Long-running process:
1. pty_spawn to start (e.g., npm run dev)
2. pty_read to check output periodically
3. pty_kill when done

### Interactive session:
1. pty_spawn with interactive command (e.g., bash, python)
2. pty_write to send commands
3. pty_read to see responses
