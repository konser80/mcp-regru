import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema, prioritySchema, ttlSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
  service: z.string().min(1, "Service name is required").describe("Service name (e.g., _sip._tcp)"),
  priority: prioritySchema,
  weight: z.number().int().min(0).max(65535).describe("Weight for load balancing (0-65535)"),
  port: z.number().int().min(0).max(65535).describe("Port number (0-65535)"),
  target: z.string().min(1, "Target hostname is required").describe("Target hostname (e.g., sip.example.com)"),
  ttl: ttlSchema,
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerAddSrv(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_add_srv_record",
    {
      title: "Add SRV Record",
      description: `Add an SRV record (service) to a domain's DNS zone on Reg.ru.

Specifies the location of a service (host and port) for service discovery.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - service (string): Service name including protocol (e.g., "_sip._tcp")
  - priority (number): Priority value 0-65535 (lower = higher priority)
  - weight (number): Weight for load balancing 0-65535
  - port (number): Port number 0-65535
  - target (string): Target hostname (e.g., "sip.example.com")
  - ttl (number): Time to live in seconds, 60-86400 (default: 3600)

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
        await client.addSrv(
          params.domain, params.service, params.priority,
          params.weight, params.port, params.target, params.ttl
        );
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "added SRV record",
              params.domain,
              `**${params.service}** → ${params.target}:${params.port} (priority: ${params.priority}, weight: ${params.weight}, TTL: ${params.ttl}s)`
            ),
          }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
