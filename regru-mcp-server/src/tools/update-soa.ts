import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema, ttlSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
  ttl: ttlSchema.optional().describe("SOA TTL in seconds (60-86400)"),
  minimum_ttl: z
    .number()
    .int()
    .min(60, "Minimum TTL must be at least 60")
    .max(86400, "Minimum TTL cannot exceed 86400")
    .optional()
    .describe("Minimum TTL for negative caching in seconds (60-86400)"),
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerUpdateSoa(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_update_soa",
    {
      title: "Update SOA Record",
      description: `Update the SOA (Start of Authority) record TTL settings for a domain on Reg.ru.

Modifies TTL values in the SOA record, which controls DNS caching behavior for the zone.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - ttl (number, optional): SOA TTL in seconds (60-86400)
  - minimum_ttl (number, optional): Minimum TTL for negative caching (60-86400)

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
        await client.updateSoa(params.domain, params.ttl, params.minimum_ttl);
        const details: string[] = [];
        if (params.ttl !== undefined) details.push(`TTL: ${params.ttl}s`);
        if (params.minimum_ttl !== undefined) details.push(`Minimum TTL: ${params.minimum_ttl}s`);
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "updated SOA record",
              params.domain,
              details.length > 0 ? details.join(", ") : undefined
            ),
          }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
