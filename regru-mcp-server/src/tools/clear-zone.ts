import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerClearZone(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_clear_zone",
    {
      title: "Clear DNS Zone",
      description: `Remove ALL DNS records for a domain on Reg.ru.

WARNING: This is a destructive and irreversible operation. It deletes every DNS record in the zone. Use regru_get_dns_records first to backup the current configuration.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")

Returns:
  Confirmation message on success.`,
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
        await client.clearZone(params.domain);
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "cleared all DNS records",
              params.domain,
              "All DNS records have been removed from the zone."
            ),
          }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
