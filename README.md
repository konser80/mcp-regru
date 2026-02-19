# regru-mcp-server

MCP server for managing DNS records via the [Reg.ru API](https://www.reg.ru/support/help/api2).

Works with [Claude Code](https://docs.anthropic.com/en/docs/claude-code), Cursor, and any other MCP-compatible client.

## Prerequisites

- Node.js >= 18
- A [Reg.ru](https://www.reg.ru/) account with API access enabled

## Installation

```bash
git clone https://github.com/konser80/mcp-regru.git
cd mcp-regru/regru-mcp-server
npm install
npm run build
```

## Configuration

The server requires your Reg.ru credentials, passed as environment variables:

| Variable | Description |
|----------|-------------|
| `REGRU_USERNAME` | Your Reg.ru account username |
| `REGRU_PASSWORD` | Your Reg.ru account password |

### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "regru": {
      "command": "node",
      "args": ["/path/to/mcp-regru/regru-mcp-server/dist/index.js"],
      "env": {
        "REGRU_USERNAME": "your_username",
        "REGRU_PASSWORD": "your_password"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project or `~/.cursor/mcp.json` globally:

```json
{
  "mcpServers": {
    "regru": {
      "command": "node",
      "args": ["/path/to/mcp-regru/regru-mcp-server/dist/index.js"],
      "env": {
        "REGRU_USERNAME": "your_username",
        "REGRU_PASSWORD": "your_password"
      }
    }
  }
}
```

### Other MCP Clients

Use the same configuration format supported by your client, pointing to `dist/index.js` with the required environment variables.

## Available Tools

| Tool | Description |
|------|-------------|
| `regru_get_dns_records` | Retrieve all DNS records for a domain |
| `regru_add_a_record` | Add an A record (IPv4) |
| `regru_add_aaaa_record` | Add an AAAA record (IPv6) |
| `regru_add_cname_record` | Add a CNAME record (alias) |
| `regru_add_mx_record` | Add an MX record (mail exchange) |
| `regru_add_txt_record` | Add a TXT record (SPF, DKIM, verification) |
| `regru_add_ns_record` | Add an NS record (nameserver delegation) |
| `regru_add_srv_record` | Add an SRV record (service discovery) |
| `regru_add_caa_record` | Add a CAA record (certificate authority) |
| `regru_remove_record` | Remove a specific DNS record |
| `regru_update_records` | Bulk add/remove DNS records in a single call |
| `regru_update_soa` | Update SOA record TTL settings |
| `regru_clear_zone` | Remove all DNS records (destructive!) |

## Usage Examples

Once configured, you can manage DNS through natural language:

- "Show DNS records for example.com"
- "Point www.example.com to 1.2.3.4"
- "Add an MX record for Google Workspace"
- "Add SPF record for example.com"
- "Remove the old A record for api.example.com"

## Development

```bash
cd regru-mcp-server
npm run dev    # Watch mode with tsx
npm run build  # Compile TypeScript
npm start      # Run compiled server
```

## License

MIT
