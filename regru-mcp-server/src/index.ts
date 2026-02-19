#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const username = process.env.REGRU_USERNAME;
  const password = process.env.REGRU_PASSWORD;

  if (!username || !password) {
    console.error(
      "ERROR: REGRU_USERNAME and REGRU_PASSWORD environment variables are required.\n" +
      "Set them in your MCP client configuration or export them in your shell."
    );
    process.exit(1);
  }

  const server = createServer(username, password);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("Reg.ru MCP server running via stdio");
}

main().catch((error: unknown) => {
  console.error("Server error:", error);
  process.exit(1);
});
