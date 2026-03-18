import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema } from "../schemas/common.js";
import { formatDomainAvailability, formatDomainAvailabilityList } from "../utils/formatter.js";

const InputSchema = z
  .object({
    domain: domainSchema.optional(),
    domains: z.array(domainSchema).min(1).optional(),
  })
  .strict()
  .refine((v) => v.domain !== undefined || v.domains !== undefined, {
    message: "Provide either 'domain' (single) or 'domains' (list)",
  });

type Input = z.infer<typeof InputSchema>;

export function registerCheckAvailability(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_check_domain_availability",
    {
      title: "Check Domain Availability",
      description: `Check if one or more domain names are available for registration on Reg.ru.

Supports single and bulk checks. Returns availability status for each domain.

Args:
  - domain (string, optional): Single domain to check (e.g., "example.com")
  - domains (string[], optional): List of domains to check in bulk (e.g., ["example.com", "example.ru"])

Provide exactly one of 'domain' or 'domains'.

Returns:
  Markdown with availability status for each domain.

Examples:
  - "Is example.com available?" -> domain="example.com"
  - "Check example.com, example.ru and example.net" -> domains=["example.com","example.ru","example.net"]`,
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
        if (params.domains !== undefined) {
          const data = await client.checkDomains(params.domains);
          const results = (data.answer?.domains ?? []).map((d) => ({
            domain: d.dname,
            status: d.result ?? "Unknown",
          }));
          return {
            content: [{ type: "text" as const, text: formatDomainAvailabilityList(results) }],
          };
        } else {
          const data = await client.checkDomain(params.domain!);
          const domainResult = data.answer?.domains?.[0];
          const status = domainResult?.result ?? "Unknown";
          return {
            content: [{ type: "text" as const, text: formatDomainAvailability(params.domain!, status) }],
          };
        }
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
