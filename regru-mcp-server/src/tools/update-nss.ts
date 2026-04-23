import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema, ipv4Schema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const hostnameSchema = z
  .string()
  .min(1, "Nameserver hostname is required")
  .max(253, "Nameserver hostname too long")
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
    "Invalid nameserver hostname (e.g., ns1.example.com)"
  );

const nameserverEntrySchema = z.object({
  host: hostnameSchema.describe("Nameserver hostname (e.g., ns1.example.com)"),
  ip: ipv4Schema
    .optional()
    .describe(
      "Optional IPv4 glue record. Required only when the nameserver is a subdomain of the domain being updated (e.g., ns1.example.com for example.com)"
    ),
}).strict();

const InputSchema = z.object({
  domain: domainSchema,
  nameservers: z
    .array(nameserverEntrySchema)
    .min(1, "At least one nameserver is required")
    .max(13, "Too many nameservers (max 13)")
    .describe("Ordered list of authoritative nameservers for the domain"),
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerUpdateNss(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_update_nss",
    {
      title: "Update Nameservers",
      description: `Replace the list of authoritative DNS servers (NS) for a domain on Reg.ru.

This changes the delegation of the domain — the new nameservers fully replace the previous list.
DNS propagation may take up to 24-48 hours. Misconfigured nameservers can make the domain temporarily unresolvable.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - nameservers (array): Ordered list of nameserver entries. Each entry:
      - host (string): Nameserver hostname (e.g., "ns1.reg.ru")
      - ip (string, optional): IPv4 glue record — only needed when the host is a subdomain of the domain itself

Examples:
  - Switch to Reg.ru DNS:
      nameservers: [{ host: "ns1.reg.ru" }, { host: "ns2.reg.ru" }]
  - Use own nameservers within the domain (glue records required):
      domain: "example.com"
      nameservers: [
        { host: "ns1.example.com", ip: "192.0.2.1" },
        { host: "ns2.example.com", ip: "192.0.2.2" }
      ]

Returns:
  Confirmation message listing the new nameserver delegation.`,
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
        await client.updateNss(params.domain, params.nameservers);
        const nsList = params.nameservers
          .map((ns, i) => `${i + 1}. ${ns.host}${ns.ip ? ` (glue: ${ns.ip})` : ""}`)
          .join("\n");
        return {
          content: [
            {
              type: "text" as const,
              text: formatSuccessMessage(
                "updated nameservers",
                params.domain,
                `**New nameserver delegation:**\n${nsList}`
              ),
            },
          ],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
