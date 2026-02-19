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

export function formatSuccessMessage(action: string, domain: string, details?: string): string {
  let msg = `Successfully ${action} for **${domain}**`;
  if (details) {
    msg += `\n\n${details}`;
  }
  return msg;
}
