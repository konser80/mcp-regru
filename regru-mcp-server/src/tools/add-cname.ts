import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema, subdomainSchema, ttlSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
  subdomain: subdomainSchema,
  canonical_name: z.string().min(1, "Canonical name is required").describe("Target domain name (e.g., example.github.io)"),
  ttl: ttlSchema,
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerAddCname(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_add_cname_record",
    {
      title: "Add CNAME Record",
      description: `Add a CNAME record (alias) to a domain's DNS zone on Reg.ru.

Creates a canonical name alias. CNAME records cannot coexist with other record types for the same subdomain.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - subdomain (string): Subdomain name (cannot be "@" for root with CNAME)
  - canonical_name (string): Target domain name (e.g., "example.github.io")
  - ttl (number): Time to live in seconds, 60-86400 (default: 3600)

Returns:
  Confirmation message on success.

Examples:
  - "Alias blog.example.com to example.github.io" -> subdomain="blog", canonical_name="example.github.io"
  - "Point www to root domain" -> subdomain="www", canonical_name="example.com"`,
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: Input) => {
      try {
        await client.addCname(params.domain, params.subdomain, params.canonical_name, params.ttl);
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "added CNAME record",
              params.domain,
              `**${params.subdomain}** → ${params.canonical_name} (TTL: ${params.ttl}s)`
            ),
          }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
