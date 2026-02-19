import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema, subdomainSchema, ttlSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
  subdomain: subdomainSchema,
  dns_server: z.string().min(1, "DNS server hostname is required").describe("Nameserver hostname (e.g., ns1.example.com)"),
  ttl: ttlSchema,
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerAddNs(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_add_ns_record",
    {
      title: "Add NS Record",
      description: `Add an NS record (nameserver) to a domain's DNS zone on Reg.ru.

Delegates DNS resolution for a subdomain to another nameserver.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - subdomain (string): Subdomain to delegate
  - dns_server (string): Nameserver hostname (e.g., "ns1.example.com")
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
        await client.addNs(params.domain, params.subdomain, params.dns_server, params.ttl);
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "added NS record",
              params.domain,
              `**${params.subdomain}** → ${params.dns_server} (TTL: ${params.ttl}s)`
            ),
          }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
