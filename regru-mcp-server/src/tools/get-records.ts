import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema } from "../schemas/common.js";
import { formatRecordsAsMarkdown } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerGetRecords(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_get_dns_records",
    {
      title: "Get DNS Records",
      description: `Retrieve all DNS records for a domain from Reg.ru.

Returns a formatted table of all DNS records including type, subdomain, content, priority, and TTL.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")

Returns:
  Markdown table with all DNS records for the domain.

Examples:
  - "Show DNS records for example.com" -> domain="example.com"
  - "What records does mydomain.ru have?" -> domain="mydomain.ru"`,
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: Input) => {
      try {
        const data = await client.getResourceRecords(params.domain);
        const records = data.answer?.domains?.[0]?.rrs ?? [];
        return {
          content: [{ type: "text" as const, text: formatRecordsAsMarkdown(params.domain, records) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
