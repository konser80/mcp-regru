import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RegruClient, handleToolError } from "../api/client.js";
import { domainSchema, subdomainSchema, ttlSchema } from "../schemas/common.js";
import { formatSuccessMessage } from "../utils/formatter.js";

const InputSchema = z.object({
  domain: domainSchema,
  subdomain: subdomainSchema,
  text: z.string().min(1, "Text content is required").max(4096, "Text content too long").describe("Text record content (e.g., SPF, DKIM, verification strings)"),
  ttl: ttlSchema,
}).strict();

type Input = z.infer<typeof InputSchema>;

export function registerAddTxt(server: McpServer, client: RegruClient): void {
  server.registerTool(
    "regru_add_txt_record",
    {
      title: "Add TXT Record",
      description: `Add a TXT record to a domain's DNS zone on Reg.ru.

Used for domain verification, SPF, DKIM, DMARC, and other text-based DNS records.

Args:
  - domain (string): Fully qualified domain name (e.g., "example.com")
  - subdomain (string): Subdomain name, "@" for root, "_dmarc" for DMARC
  - text (string): Text content (e.g., "v=spf1 include:_spf.google.com ~all")
  - ttl (number): Time to live in seconds, 60-86400 (default: 3600)

Returns:
  Confirmation message on success.

Examples:
  - "Add SPF record" -> subdomain="@", text="v=spf1 include:_spf.google.com ~all"
  - "Verify domain for Google" -> subdomain="@", text="google-site-verification=..."
  - "Add DMARC policy" -> subdomain="_dmarc", text="v=DMARC1; p=quarantine"`,
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
        await client.addTxt(params.domain, params.subdomain, params.text, params.ttl);
        const truncatedText = params.text.length > 60 ? params.text.slice(0, 60) + "..." : params.text;
        return {
          content: [{
            type: "text" as const,
            text: formatSuccessMessage(
              "added TXT record",
              params.domain,
              `**${params.subdomain}** → \`${truncatedText}\` (TTL: ${params.ttl}s)`
            ),
          }],
        };
      } catch (error) {
        return handleToolError(error);
      }
    }
  );
}
