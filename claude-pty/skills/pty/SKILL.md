---
name: pty
description: Manage PTY terminal sessions. Use when user needs to spawn a new terminal, read terminal output, send input to a running session, list active sessions, or kill a session.
---

PTY Terminal Session Management

## Available Tools

- **pty_spawn**: Create a new terminal session with specified command
- **pty_read**: Read output from a running session
- **pty_write**: Send input to a running session
- **pty_list**: List all active terminal sessions
- **pty_kill**: Terminate a terminal session

## Usage

1. Use pty_spawn to create new sessions
2. Use pty_read to check session output
3. Use pty_write for interactive input
4. Use pty_kill to clean up sessions when done
