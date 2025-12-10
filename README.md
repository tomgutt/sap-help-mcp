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

## Configuration

The server supports the following optional environment variables:

- **`SEARCH_RESULTS`** (default: `20`) - Maximum number of search results to return
- **`SEARCH_PRODUCT`** (default: `""`) - Filter search results by product name
- **`SEARCH_SNIPPET_CHARS`** (default: `400`) - Maximum length of snippet text in characters

### Example MCP client config (npx)
```json
{
  "mcpServers": {
    "sap-help-mcp": {
      "command": "npx",
      "args": ["-y", "sap-help-mcp"],
      "env": {
        "SEARCH_RESULTS": "10",
        "SEARCH_PRODUCT": "LEANIX",
        "SEARCH_SNIPPET_CHARS": "800"
      }
    }
  }
}
```