export interface DnsRecord {
  rectype: string;
  subname: string;
  content: string;
  prio: number;
  state?: string;
}

export function formatRecordsAsMarkdown(domain: string, records: DnsRecord[]): string {
  if (records.length === 0) {
    return `No DNS records found for **${domain}**.`;
  }

  const lines: string[] = [
    `# DNS Records for ${domain}`,
    "",
    `Total records: ${records.length}`,
    "",
    "| Type | Subdomain | Content | Priority |",
    "|------|-----------|---------|----------|",
  ];

  for (const r of records) {
    lines.push(`| ${r.rectype} | ${r.subname} | ${r.content} | ${r.prio} |`);
  }

  return lines.join("\n");
}

function isAvailableStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "available" || s === "free";
}

export function formatDomainAvailability(domain: string, status: string): string {
  const indicator = isAvailableStatus(status) ? "✓" : "✗";
  return `# Domain Availability\n\n**${domain}** — ${status} ${indicator}`;
}

export function formatDomainAvailabilityList(results: Array<{ domain: string; status: string }>): string {
  const lines: string[] = [
    "# Domain Availability",
    "",
    "| Domain | Status |",
    "|--------|--------|",
  ];
  for (const r of results) {
    const indicator = isAvailableStatus(r.status) ? "✓" : "✗";
    lines.push(`| ${r.domain} | ${r.status} ${indicator} |`);
  }
  return lines.join("\n");
}

export interface ServiceInfo {
  service_id: number;
  dname?: string;
  servtype?: string;
  subtype?: string;
  state?: string;
  expiration_date?: string;
  creation_date?: string;
}

export function formatServiceList(services: ServiceInfo[]): string {
  if (services.length === 0) {
    return "No services found.";
  }

  const lines: string[] = [
    `# Services (${services.length})`,
    "",
    "| # | Domain | Type | State | Expires | Service ID |",
    "|---|--------|------|-------|---------|------------|",
  ];

  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    const name = s.dname || "—";
    const stype = [s.servtype, s.subtype].filter(Boolean).join("/") || "—";
    const state = s.state || "—";
    const expires = s.expiration_date || "—";
    lines.push(`| ${i + 1} | ${name} | ${stype} | ${state} | ${expires} | ${s.service_id} |`);
  }

  return lines.join("\n");
}

export function formatNameservers(
  domain: string,
  nameservers: Array<{ ns: string; ip?: string }>
): string {
  if (nameservers.length === 0) {
    return `No nameservers configured for **${domain}**.`;
  }
  const lines: string[] = [`# Nameservers for ${domain}`, ""];
  for (let i = 0; i < nameservers.length; i++) {
    const n = nameservers[i];
    lines.push(`${i + 1}. ${n.ns}${n.ip ? ` (glue: ${n.ip})` : ""}`);
  }
  return lines.join("\n");
}

export function formatSuccessMessage(action: string, domain: string, details?: string): string {
  let msg = `Successfully ${action} for **${domain}**`;
  if (details) {
    msg += `\n\n${details}`;
  }
  return msg;
}
