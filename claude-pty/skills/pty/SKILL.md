---
name: pty
description: |
  Manage PTY (pseudo-terminal) sessions in Claude Code. 
  Use when user needs to:
  - Spawn a new terminal session with a command
  - Read output from a running terminal session
  - Send input to an interactive terminal session
  - List all active terminal sessions
  - Kill/terminate a terminal session
---

PTY Terminal Session Management

## Available Tools
- pty_spawn: Create new terminal session
- pty_read: Read session output  
- pty_write: Send input to session
- pty_list: List active sessions
- pty_kill: Terminate session
