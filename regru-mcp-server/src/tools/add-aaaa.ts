import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema, subdomainSchema, ipv6Schema, ttlSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
  subdomain: subdomainSchema,
  ipaddr: ipv6Schema,
  ttl: ttlSchema,
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerAddAaaa(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_add_aaaa_record",
    {
      title: "Add AAAA Record",
      description: `Add an AAAA record (IPv6) to a domain's DNS zone on Reg.ru.

Points a subdomain to an IPv6 address.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - subdomain (string): Subdomain name, "@" for root, "*" for wildcard
  - ipaddr (string): IPv6 address (e.g., "2001:0db8:85a3::8a2e:0370:7334")
  - ttl (number): Time to live in seconds, 60-86400 (default: 3600)

Returns:
  Confirmation message on success.`,
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
        await client.addAaaa(params.domain, params.subdomain, params.ipaddr, params.ttl);
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "added AAAA record",
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
