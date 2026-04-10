import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { formatServiceList } from "../utils/formatter.js";

const InputSchema = z
  .object({
    servtype: z
      .string()
      .optional()
      .describe(
        'Filter by service type (e.g., "domain", "srv_hosting_ispmgr", "srv_ssl_certificate"). Omit to list all services.'
      ),
  })
  .strict();

type Input = z.infer<typeof InputSchema>;

export function registerGetServices(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_get_services",
    {
      title: "Get Services List",
      description: `Retrieve the list of active services (domains, hosting, SSL, etc.) from the Reg.ru account.

Returns a formatted table of all services with their type, state, and expiration date.

Args:
  - servtype (string, optional): Filter by service type. Common values:
      "domain" — domain names only
      "srv_hosting_ispmgr" — hosting services
      "srv_ssl_certificate" — SSL certificates
    Omit to get all services.

Returns:
  Markdown table with all services.

Examples:
  - "Show my domains" -> servtype="domain"
  - "List all services" -> (no parameters)
  - "What hosting do I have?" -> servtype="srv_hosting_ispmgr"`,
      inputSchema: InputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: Input) => {
      try {
        const data = await client.getServiceList(params.servtype);
        const services = data.answer?.services ?? [];
        return {
          content: [{ type: "text" as const, text: formatServiceList(services) }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
