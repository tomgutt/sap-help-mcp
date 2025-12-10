#!/usr/bin/env node
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { getSapHelpContent, searchSapHelp } from "./lib/sapHelp.js";

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

// Environment variables with defaults
const SEARCH_SNIPPET_CHARS = Number(process.env.SEARCH_SNIPPET_CHARS || 400);

type SearchResult = {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  score?: number;
  metadata?: Record<string, any>;
};

type DocumentResult = {
  id: string;
  title: string;
  text: string;
  url: string;
  metadata?: Record<string, any>;
};

function createSearchResponse(results: SearchResult[]) {
  const cleanedResults = results.map((result) => ({
    id: result.id,
    title: result.title
      ? result.title
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
      : result.title,
    url: result.url,
    snippet: result.snippet
      ? result.snippet
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
      : result.snippet,
    score: result.score,
    metadata: result.metadata
  }));

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ results: cleanedResults })
      }
    ]
  };
}

function createDocumentResponse(document: DocumentResult) {
  const cleanedDocument = {
    id: document.id,
    title: document.title,
    text: document.text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n"),
    url: document.url,
    metadata: document.metadata
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(cleanedDocument)
      }
    ]
  };
}

function createErrorResponse(error: string) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ error })
      }
    ]
  };
}

function createServer() {
  const srv = new Server(
    {
      name: "SAP Docs MCP",
      version
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  srv.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "sap_help_search",
          description: "Search the SAP Help Portal for product documentation.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search terms to find SAP Help documentation"
              }
            },
            required: ["query"]
          }
        },
        {
          name: "sap_help_get",
          description: "Retrieve full SAP Help page content by result_id returned from sap_help_search.",
          inputSchema: {
            type: "object",
            properties: {
              result_id: {
                type: "string",
                description: "Result ID from sap_help_search (e.g., sap-help-<loio>)"
              }
            },
            required: ["result_id"]
          }
        }
      ]
    };
  });

  srv.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "sap_help_search") {
      const { query } = (args || {}) as { query?: string };
      if (!query || typeof query !== "string") {
        return createErrorResponse("Missing required parameter: query");
      }

      const res = await searchSapHelp(query);
      if (!res.results.length) {
        return createErrorResponse(
          res.error ||
            `No SAP Help results found for "${query}". Try different keywords.`
        );
      }

      const helpResults: SearchResult[] = res.results.map((r, index) => {
        let snippet = r.description || "";
        if (snippet.length > SEARCH_SNIPPET_CHARS) {
          snippet = snippet.substring(0, SEARCH_SNIPPET_CHARS) + "...";
        }
        return {
          id: r.id || `sap-help-${index}`,
          title: r.title || "SAP Help Document",
          url: r.url || `#${r.id}`,
          snippet,
          metadata: {
            source: "sap-help",
            totalSnippets: r.totalSnippets,
            rank: index + 1
          }
        };
      });

      return createSearchResponse(helpResults);
    }

    if (name === "sap_help_get") {
      const { result_id } = (args || {}) as { result_id?: string };
      if (!result_id || typeof result_id !== "string") {
        return createErrorResponse("Missing required parameter: result_id");
      }

      const content = await getSapHelpContent(result_id);
      const document: DocumentResult = {
        id: result_id,
        title: `SAP Help Document (${result_id})`,
        text: content,
        url: `https://help.sap.com/#${result_id}`,
        metadata: {
          source: "sap-help",
          resultId: result_id,
          contentLength: content.length
        }
      };

      return createDocumentResponse(document);
    }

    return createErrorResponse(`Unknown tool: ${name}`);
  });

  return srv;
}

async function main() {
  const srv = createServer();
  await srv.connect(new StdioServerTransport());
  console.error("📚 MCP SAP Help server ready (stdio).");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
