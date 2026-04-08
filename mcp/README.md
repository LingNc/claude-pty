# Claude PTY MCP Server

MCP (Model Context Protocol) server for PTY terminal integration.

## Installation

```bash
npm install -g claude-pty
# or
npx claude-pty-mcp
```

## Usage with Claude Code

Add to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "claude-pty": {
      "command": "claude-pty-mcp",
      "args": []
    }
  }
}
```

Or run directly:

```bash
node ./mcp/dist/server.js
```

## Available Tools

- **pty_spawn** - Create a new PTY session
- **pty_read** - Read output from a PTY session
- **pty_write** - Send input to a PTY session
- **pty_kill** - Terminate a PTY session
- **pty_list** - List all active PTY sessions

## Development

```bash
cd mcp
npm install
npm run build
npm start
```

## License

MIT
