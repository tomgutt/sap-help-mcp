# SAP Help MCP Server

Minimal MCP stdio server exposing only SAP Help tools.

## Tools
- `sap_help_search` — search SAP Help Portal
- `sap_help_get` — fetch full content for a search result ID

## Quick start (local stdio)
```bash
npm install
npm run build
npm start   # runs node dist/server.js
```

### Example MCP client config (stdio)
```json
{
  "mcpServers": {
    "sap-help-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/dist/server.js"]
    }
  }
}
```

### Example MCP client config (npx)
```json
{
  "mcpServers": {
    "sap-help-mcp": {
      "command": "npx",
      "args": ["-y", "sap-help-mcp"]
    }
  }
}
```