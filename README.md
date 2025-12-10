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

### Example client configs
- Command: `node`
- Args: `["/absolute/path/to/dist/server.js"]`

## Publish hint
Package is set up as an npm module with `main` pointing to `dist/server.js`; run `npm run build` before publishing.
