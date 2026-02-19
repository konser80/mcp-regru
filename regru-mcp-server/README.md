# regru-mcp-server

MCP server for managing DNS records via the [Reg.ru API](https://www.reg.ru/support/help/api2).

## Installation

```bash
cd regru-mcp-server
npm install
npm run build
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REGRU_USERNAME` | Yes | Your Reg.ru account username |
| `REGRU_PASSWORD` | Yes | Your Reg.ru account password |

### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "regru": {
      "command": "node",
      "args": ["/absolute/path/to/regru-mcp-server/dist/index.js"],
      "env": {
        "REGRU_USERNAME": "your_username",
        "REGRU_PASSWORD": "your_password"
      }
    }
  }
}
```

### Cursor / Other MCP Clients

Use the same configuration format supported by your client, pointing to `dist/index.js` with the required environment variables.

## Tools

| Tool | Description |
|------|-------------|
| `regru_get_dns_records` | Get all DNS records for a domain |
| `regru_add_a_record` | Add an A record (IPv4) |
| `regru_add_aaaa_record` | Add an AAAA record (IPv6) |
| `regru_add_cname_record` | Add a CNAME record (alias) |
| `regru_add_mx_record` | Add an MX record (mail exchange) |
| `regru_add_txt_record` | Add a TXT record (SPF, DKIM, verification) |
| `regru_add_ns_record` | Add an NS record (nameserver delegation) |
| `regru_add_srv_record` | Add an SRV record (service discovery) |
| `regru_add_caa_record` | Add a CAA record (certificate authority) |
| `regru_remove_record` | Remove a specific DNS record |
| `regru_update_records` | Bulk add/remove DNS records |
| `regru_update_soa` | Update SOA record TTL settings |
| `regru_clear_zone` | Remove all DNS records (destructive) |

## Development

```bash
npm run dev    # Watch mode with tsx
npm run build  # Compile TypeScript
npm start      # Run compiled server
```
