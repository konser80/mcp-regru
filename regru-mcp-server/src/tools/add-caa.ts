import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema, subdomainSchema, ttlSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
  subdomain: subdomainSchema,
  flags: z.number().int().min(0).max(255).default(0).describe("CAA flags (0-255, typically 0)"),
  tag: z.enum(["issue", "issuewild", "iodef"]).describe("CAA tag: 'issue', 'issuewild', or 'iodef'"),
  value: z.string().min(1, "CAA value is required").describe("CAA value (e.g., 'letsencrypt.org' or 'mailto:security@example.com')"),
  ttl: ttlSchema,
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerAddCaa(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_add_caa_record",
    {
      title: "Add CAA Record",
      description: `Add a CAA record (Certificate Authority Authorization) to a domain's DNS zone on Reg.ru.

Controls which certificate authorities can issue SSL certificates for the domain.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - subdomain (string): Subdomain name, "@" for root
  - flags (number): CAA flags 0-255, typically 0 (default: 0)
  - tag (string): "issue" (allow CA), "issuewild" (allow wildcard), or "iodef" (report violations)
  - value (string): CA domain or reporting URI (e.g., "letsencrypt.org")
  - ttl (number): Time to live in seconds, 60-86400 (default: 3600)

Returns:
  Confirmation message on success.

Examples:
  - "Allow Let's Encrypt to issue certs" -> tag="issue", value="letsencrypt.org"
  - "Block all wildcard certs" -> tag="issuewild", value=";"`,
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
        await client.addCaa(
          params.domain, params.subdomain, params.flags,
          params.tag, params.value, params.ttl
        );
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "added CAA record",
              params.domain,
              `**${params.subdomain}** → ${params.flags} ${params.tag} "${params.value}" (TTL: ${params.ttl}s)`
            ),
          }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
