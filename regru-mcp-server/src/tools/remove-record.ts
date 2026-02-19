import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema, subdomainSchema, recordTypeSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
  subdomain: subdomainSchema,
  record_type: recordTypeSchema,
  content: z.string().min(1, "Record content is required").describe("Record content to match for deletion (e.g., IP address, hostname)"),
  priority: z.number().int().min(0).max(65535).optional().describe("Priority value (required for MX records)"),
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerRemoveRecord(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_remove_record",
    {
      title: "Remove DNS Record",
      description: `Remove a specific DNS record from a domain's zone on Reg.ru.

Deletes a single record matching the specified type, subdomain, and content. Use regru_get_dns_records first to see exact record values.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - subdomain (string): Subdomain of the record to remove
  - record_type (string): Record type — "A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA", or "SOA"
  - content (string): Record content to match (e.g., "192.168.1.1" for A records)
  - priority (number, optional): Priority value, required for MX records

Returns:
  Confirmation message on success.

Examples:
  - "Remove A record for www pointing to 1.2.3.4" -> subdomain="www", record_type="A", content="1.2.3.4"
  - "Delete MX record for mail.example.com" -> subdomain="@", record_type="MX", content="mail.example.com", priority=10`,
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: Input) => {
      try {
        await client.removeRecord(
          params.domain, params.subdomain, params.record_type,
          params.content, params.priority
        );
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "removed DNS record",
              params.domain,
              `Removed ${params.record_type} record: **${params.subdomain}** → ${params.content}`
            ),
          }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
