import { RegruApiError, formatApiError, formatUnexpectedError } from "../utils/errors.js";

const BASE_URL = "https://api.reg.ru/api/regru2";

export interface RegruApiResponse {
  result: string;
  answer?: {
    domains?: Array<{
      dname: string;
      result: string;
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
      service_id?: string;
      error_code?: string;
      error_text?: string;
    }>;
  };
  error_code?: string;
  error_text?: string;
}

export class RegruClient {
  private username: string;
  private password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  async request(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<RegruApiResponse> {
    const body = new URLSearchParams({
      username: this.username,
      password: this.password,
      output_content_type: "plain",
      ...params,
    });

    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(30000),
    });

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
    if (domainResult && domainResult.result === "error") {
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
    const params: Record<string, string> = {
      domain_name: domain,
    };
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      params[`action_list[${i}][action]`] = a.action;
      params[`action_list[${i}][type]`] = a.type;
      params[`action_list[${i}][subdomain]`] = a.subdomain;
      params[`action_list[${i}][content]`] = a.content;
      if (a.priority !== undefined) params[`action_list[${i}][priority]`] = String(a.priority);
      if (a.ttl !== undefined) params[`action_list[${i}][ttl]`] = String(a.ttl);
    }
    return this.request("zone/update_records", params);
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
