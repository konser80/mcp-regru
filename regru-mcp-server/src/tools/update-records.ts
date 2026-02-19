import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const ActionSchema = z.object({
  action: z.enum(["add", "remove"]).describe("Action: 'add' or 'remove'"),
  type: z.string().min(1).describe("Record type (A, AAAA, CNAME, MX, TXT, etc.)"),
  subdomain: z.string().min(1).describe("Subdomain name"),
  content: z.string().min(1).describe("Record content"),
  priority: z.number().int().min(0).max(65535).optional().describe("Priority (for MX/SRV records)"),
  ttl: z.number().int().min(60).max(86400).optional().describe("TTL in seconds"),
});

const InputSchema = z.object({
  domain: domainSchema,
  actions: z.array(ActionSchema).min(1, "At least one action is required").max(50, "Maximum 50 actions per request")
    .describe("Array of add/remove actions to perform"),
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerUpdateRecords(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_update_records",
    {
      title: "Bulk Update DNS Records",
      description: `Perform bulk add/remove operations on DNS records for a domain on Reg.ru.

Executes multiple add and remove actions in a single API call. Useful for migrating DNS configurations or making coordinated changes.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - actions (array): List of actions, each with:
    - action (string): "add" or "remove"
    - type (string): Record type (A, AAAA, CNAME, MX, TXT, NS, SRV, CAA)
    - subdomain (string): Subdomain name
    - content (string): Record content
    - priority (number, optional): Priority for MX/SRV records
    - ttl (number, optional): TTL in seconds

Returns:
  Confirmation with summary of actions performed.

Examples:
  - Replace an A record: actions=[{action:"remove", type:"A", subdomain:"www", content:"1.1.1.1"}, {action:"add", type:"A", subdomain:"www", content:"2.2.2.2"}]`,
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params: Input) => {
      try {
        await client.updateRecords(params.domain, params.actions);
        const added = params.actions.filter(a => a.action === "add").length;
        const removed = params.actions.filter(a => a.action === "remove").length;
        const parts: string[] = [];
        if (added > 0) parts.push(`${added} added`);
        if (removed > 0) parts.push(`${removed} removed`);
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "updated DNS records",
              params.domain,
              `${params.actions.length} actions performed (${parts.join(", ")})`
            ),
          }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
