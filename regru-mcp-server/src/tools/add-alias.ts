import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema, subdomainSchema, ipv4Schema, ttlSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
  subdomain: subdomainSchema,
  ipaddr: ipv4Schema,
  ttl: ttlSchema,
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerAddAlias(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_add_a_record",
    {
      title: "Add A Record",
      description: `Add an A record (IPv4) to a domain's DNS zone on Reg.ru.

Points a subdomain to an IPv4 address. Multiple A records for the same subdomain create round-robin DNS.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - subdomain (string): Subdomain name, "@" for root, "*" for wildcard
  - ipaddr (string): IPv4 address (e.g., "192.168.1.1")
  - ttl (number): Time to live in seconds, 60-86400 (default: 3600)

Returns:
  Confirmation message on success.

Examples:
  - "Point www.example.com to 1.2.3.4" -> domain="example.com", subdomain="www", ipaddr="1.2.3.4"
  - "Set root domain to 10.0.0.1" -> domain="example.com", subdomain="@", ipaddr="10.0.0.1"`,
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
        await client.addAlias(params.domain, params.subdomain, params.ipaddr, params.ttl);
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "added A record",
              params.domain,
              `**${params.subdomain}** → ${params.ipaddr} (TTL: ${params.ttl}s)`
            ),
          }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
