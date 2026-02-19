import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema, subdomainSchema, prioritySchema, ttlSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
  subdomain: subdomainSchema,
  mail_server: z.string().min(1, "Mail server hostname is required").describe("Mail server hostname (e.g., mail.example.com)"),
  priority: prioritySchema,
  ttl: ttlSchema,
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerAddMx(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_add_mx_record",
    {
      title: "Add MX Record",
      description: `Add an MX record (mail exchange) to a domain's DNS zone on Reg.ru.

Configures mail delivery for the domain. Lower priority values mean higher preference.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - subdomain (string): Subdomain, typically "@" for root
  - mail_server (string): Mail server hostname (e.g., "aspmx.l.google.com")
  - priority (number): Priority value 0-65535 (lower = higher priority, e.g., 10)
  - ttl (number): Time to live in seconds, 60-86400 (default: 3600)

Returns:
  Confirmation message on success.

Examples:
  - "Set up Google Workspace mail" -> subdomain="@", mail_server="aspmx.l.google.com", priority=1
  - "Add backup mail server" -> mail_server="alt1.aspmx.l.google.com", priority=5`,
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
        await client.addMx(params.domain, params.subdomain, params.mail_server, params.priority, params.ttl);
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "added MX record",
              params.domain,
              `**${params.subdomain}** → ${params.mail_server} (priority: ${params.priority}, TTL: ${params.ttl}s)`
            ),
          }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
