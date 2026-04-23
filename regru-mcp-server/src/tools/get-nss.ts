import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema } from "../schemas/common.js";
import { formatNameservers } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerGetNss(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_get_nss",
    {
      title: "Get Nameservers",
      description: `Retrieve the authoritative DNS servers (NS delegation) currently set for a domain at Reg.ru.

This reflects the delegation stored by the registrar — not DNS propagation in the wild.
Use \`dig NS <domain>\` to see what the public internet currently resolves.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")

Returns:
  Ordered list of nameservers, with glue-record IPs when present.`,
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
        const data = await client.getNss(params.domain);
        const nss = data.answer?.domains?.[0]?.nss ?? [];
        return {
          content: [
            {
              type: "text" as const,
              text: formatNameservers(params.domain, nss),
            },
          ],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
