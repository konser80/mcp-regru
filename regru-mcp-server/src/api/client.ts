import { ProxyAgent, fetch as undiciFetch } from "undici";
import { RegruApiError, formatApiError, formatUnexpectedError } from "../utils/errors.js";

const BASE_URL = "https://api.reg.ru/api/regru2";

export interface RegruService {
  service_id: number;
  dname?: string;
  servtype?: string;
  subtype?: string;
  state?: string;
  expiration_date?: string;
  creation_date?: string;
  uplink_service_id?: number;
  [key: string]: unknown;
}

export interface RegruApiResponse {
  result: string;
  answer?: {
    domains?: Array<{
      dname: string;
      result: string;
      status?: string;
      rrs?: Array<{
        rectype: string;
        subname: string;
        content: string;
        prio: number;
        state?: string;
      }>;
      soa?: {
        ttl: string;
        minimum_ttl: string;
      };
      nss?: Array<{ ns: string; ip?: string }>;
      service_id?: string;
      error_code?: string;
      error_text?: string;
    }>;
    services?: RegruService[];
  };
  error_code?: string;
  error_text?: string;
}

export class RegruClient {
  private username: string;
  private password: string;
  private proxyAgent: ProxyAgent | undefined;

  constructor(username: string, password: string, proxyUrl?: string) {
    this.username = username;
    this.password = password;
    if (proxyUrl) {
      this.proxyAgent = new ProxyAgent(proxyUrl);
    }
  }

  async request(
    endpoint: string,
    params: Record<string, string> | URLSearchParams = {},
    options: { skipDomainErrorCheck?: boolean } = {}
  ): Promise<RegruApiResponse> {
    const body = new URLSearchParams();
    body.append("username", this.username);
    body.append("password", this.password);
    body.append("output_content_type", "plain");
    if (params instanceof URLSearchParams) {
      for (const [k, v] of params) body.append(k, v);
    } else {
      for (const [k, v] of Object.entries(params)) body.append(k, v);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchOptions: Record<string, any> = {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(30000),
    };
    if (this.proxyAgent) {
      fetchOptions["dispatcher"] = this.proxyAgent;
    }

    const fetchFn = this.proxyAgent ? undiciFetch : fetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await fetchFn(`${BASE_URL}/${endpoint}`, fetchOptions as any);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as RegruApiResponse;

    if (data.result === "error") {
      const apiError: RegruApiError = {
        result: "error",
        error_code: data.error_code ?? "UNKNOWN_ERROR",
        error_text: data.error_text ?? "Unknown error",
      };
      throw new RegruApiClientError(formatApiError(apiError), apiError);
    }

    // Check domain-level errors
    const domainResult = data.answer?.domains?.[0];
    if (!options.skipDomainErrorCheck && domainResult && domainResult.result === "error") {
      const apiError: RegruApiError = {
        result: "error",
        error_code: domainResult.error_code ?? "UNKNOWN_ERROR",
        error_text: domainResult.error_text ?? "Unknown error",
      };
      throw new RegruApiClientError(formatApiError(apiError), apiError);
    }

    return data;
  }

  async getResourceRecords(domain: string): Promise<RegruApiResponse> {
    return this.request("zone/get_resource_records", {
      domain_name: domain,
    });
  }

  async addAlias(
    domain: string,
    subdomain: string,
    ipaddr: string,
    ttl?: number
  ): Promise<RegruApiResponse> {
    const params: Record<string, string> = {
      domain_name: domain,
      subdomain,
      ipaddr,
    };
    if (ttl !== undefined) params.ttl = String(ttl);
    return this.request("zone/add_alias", params);
  }

  async addAaaa(
    domain: string,
    subdomain: string,
    ipaddr: string,
    ttl?: number
  ): Promise<RegruApiResponse> {
    const params: Record<string, string> = {
      domain_name: domain,
      subdomain,
      ipaddr,
    };
    if (ttl !== undefined) params.ttl = String(ttl);
    return this.request("zone/add_aaaa", params);
  }

  async addCname(
    domain: string,
    subdomain: string,
    canonicalName: string,
    ttl?: number
  ): Promise<RegruApiResponse> {
    const params: Record<string, string> = {
      domain_name: domain,
      subdomain,
      canonical_name: canonicalName,
    };
    if (ttl !== undefined) params.ttl = String(ttl);
    return this.request("zone/add_cname", params);
  }

  async addMx(
    domain: string,
    subdomain: string,
    mailServer: string,
    priority: number,
    ttl?: number
  ): Promise<RegruApiResponse> {
    const params: Record<string, string> = {
      domain_name: domain,
      subdomain,
      mail_server: mailServer,
      priority: String(priority),
    };
    if (ttl !== undefined) params.ttl = String(ttl);
    return this.request("zone/add_mx", params);
  }

  async addTxt(
    domain: string,
    subdomain: string,
    text: string,
    ttl?: number
  ): Promise<RegruApiResponse> {
    const params: Record<string, string> = {
      domain_name: domain,
      subdomain,
      text,
    };
    if (ttl !== undefined) params.ttl = String(ttl);
    return this.request("zone/add_txt", params);
  }

  async addNs(
    domain: string,
    subdomain: string,
    dnsServer: string,
    ttl?: number
  ): Promise<RegruApiResponse> {
    const params: Record<string, string> = {
      domain_name: domain,
      subdomain,
      dns_server: dnsServer,
    };
    if (ttl !== undefined) params.ttl = String(ttl);
    return this.request("zone/add_ns", params);
  }

  async addSrv(
    domain: string,
    service: string,
    priority: number,
    weight: number,
    port: number,
    target: string,
    ttl?: number
  ): Promise<RegruApiResponse> {
    const params: Record<string, string> = {
      domain_name: domain,
      service,
      priority: String(priority),
      weight: String(weight),
      port: String(port),
      target,
    };
    if (ttl !== undefined) params.ttl = String(ttl);
    return this.request("zone/add_srv", params);
  }

  async addCaa(
    domain: string,
    subdomain: string,
    flags: number,
    tag: string,
    value: string,
    ttl?: number
  ): Promise<RegruApiResponse> {
    const params: Record<string, string> = {
      domain_name: domain,
      subdomain,
      flags: String(flags),
      tag,
      value,
    };
    if (ttl !== undefined) params.ttl = String(ttl);
    return this.request("zone/add_caa", params);
  }

  async removeRecord(
    domain: string,
    subdomain: string,
    recordType: string,
    content: string,
    priority?: number
  ): Promise<RegruApiResponse> {
    const params: Record<string, string> = {
      domain_name: domain,
      subdomain,
      record_type: recordType,
      content,
    };
    if (priority !== undefined) params.priority = String(priority);
    return this.request("zone/remove_record", params);
  }

  async updateRecords(
    domain: string,
    actions: Array<{
      action: "add" | "remove";
      type: string;
      subdomain: string;
      content: string;
      priority?: number;
      ttl?: number;
    }>
  ): Promise<RegruApiResponse> {
    const actionList = actions.map((a, i) => {
      const type = a.type.toUpperCase();
      if (a.action === "remove") {
        const rec: Record<string, unknown> = {
          action: "remove_record",
          subdomain: a.subdomain,
          record_type: type,
          content: a.content,
        };
        if (a.priority !== undefined) rec.priority = a.priority;
        return rec;
      }
      const base: Record<string, unknown> = { subdomain: a.subdomain };
      if (a.ttl !== undefined) base.ttl = a.ttl;
      switch (type) {
        case "A":
          return { action: "add_alias", ...base, ipaddr: a.content };
        case "AAAA":
          return { action: "add_aaaa", ...base, ipaddr: a.content };
        case "CNAME":
          return { action: "add_cname", ...base, canonical_name: a.content };
        case "MX":
          if (a.priority === undefined) {
            throw new Error(`action[${i}]: MX add requires priority`);
          }
          return { action: "add_mx", ...base, mail_server: a.content, priority: a.priority };
        case "TXT":
          return { action: "add_txt", ...base, text: a.content };
        case "NS":
          return { action: "add_ns", ...base, dns_server: a.content };
        case "SRV":
        case "CAA":
          throw new Error(
            `action[${i}]: bulk add of ${type} is not supported — use regru_add_${type.toLowerCase()}_record (needs fields that don't fit the generic content/priority shape)`
          );
        default:
          throw new Error(`action[${i}]: unsupported record type "${a.type}"`);
      }
    });
    return this.request("zone/update_records", {
      input_format: "json",
      input_data: JSON.stringify({ domain_name: domain, action_list: actionList }),
    });
  }

  async updateSoa(
    domain: string,
    ttl?: number,
    minimumTtl?: number
  ): Promise<RegruApiResponse> {
    const params: Record<string, string> = {
      domain_name: domain,
    };
    if (ttl !== undefined) params.ttl = String(ttl);
    if (minimumTtl !== undefined) params.minimum_ttl = String(minimumTtl);
    return this.request("zone/update_soa", params);
  }

  async clearZone(domain: string): Promise<RegruApiResponse> {
    return this.request("zone/clear", {
      domain_name: domain,
    });
  }

  async getNss(domain: string): Promise<RegruApiResponse> {
    return this.request("domain/get_nss", {
      domain_name: domain,
    });
  }

  async updateNss(
    domain: string,
    nameservers: Array<{ host: string; ip?: string }>
  ): Promise<RegruApiResponse> {
    const nss: Record<string, string> = {};
    for (let i = 0; i < nameservers.length; i++) {
      const ns = nameservers[i];
      nss[`ns${i}`] = ns.host;
      if (ns.ip) nss[`ns${i}ip`] = ns.ip;
    }
    return this.request("domain/update_nss", {
      input_format: "json",
      input_data: JSON.stringify({ domain_name: domain, nss }),
    });
  }

  async getServiceList(servtype?: string): Promise<RegruApiResponse> {
    const params: Record<string, string> = {};
    if (servtype) params.servtype = servtype;
    return this.request("service/get_list", params, { skipDomainErrorCheck: true });
  }

  async checkDomain(domain: string): Promise<RegruApiResponse> {
    return this.request("domain/check", { dname: domain }, { skipDomainErrorCheck: true });
  }

  async checkDomains(domains: string[]): Promise<RegruApiResponse> {
    const params = new URLSearchParams();
    for (const d of domains) params.append("domain_name", d);
    return this.request("domain/check", params, { skipDomainErrorCheck: true });
  }
}

export class RegruApiClientError extends Error {
  public readonly apiError: RegruApiError;

  constructor(message: string, apiError: RegruApiError) {
    super(message);
    this.name = "RegruApiClientError";
    this.apiError = apiError;
  }
}

export function handleToolError(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  if (error instanceof RegruApiClientError) {
    return {
      content: [{ type: "text" as const, text: error.message }],
      isError: true,
    };
  }
  return {
    content: [{ type: "text" as const, text: formatUnexpectedError(error) }],
    isError: true,
  };
}
