const ERROR_MESSAGES: Record<string, string> = {
  AUTH_ERROR:
    "Authentication failed. Check that REGRU_USERNAME and REGRU_PASSWORD environment variables are correct.",
  DOMAIN_NOT_FOUND:
    "Domain not found in your Reg.ru account. Verify domain ownership and spelling.",
  INVALID_DOMAIN_NAME:
    "Invalid domain name format. Provide a valid domain like 'example.com'.",
  RECORD_ALREADY_EXISTS:
    "This DNS record already exists. Remove the existing record first or use a different subdomain/value.",
  ACCESS_DENIED:
    "Access denied. Your Reg.ru account may lack API permissions. Enable API access in account settings.",
  INVALID_IP_ADDRESS:
    "Invalid IP address format. Provide a valid IPv4 (e.g., 1.2.3.4) or IPv6 address.",
  TOO_MANY_REQUESTS:
    "Rate limit exceeded (max 1200 requests/hour). Wait a moment and try again.",
  DOMAIN_BAD_NAME:
    "Bad domain name. Check the domain format — it should be like 'example.com'.",
  NO_DOMAIN:
    "No domain specified. Provide a domain name.",
  SERVICE_UNAVAILABLE:
    "Reg.ru API is temporarily unavailable. Try again in a few minutes.",
};

export interface RegruApiError {
  result: "error";
  error_code: string;
  error_text: string;
  error_params?: Record<string, unknown>;
}

export function formatApiError(error: RegruApiError): string {
  const actionable = ERROR_MESSAGES[error.error_code];
  if (actionable) {
    return `Error: ${actionable}`;
  }
  return `Error from Reg.ru API: [${error.error_code}] ${error.error_text}`;
}

export function formatUnexpectedError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND")) {
      return "Error: Cannot connect to Reg.ru API. Check your internet connection.";
    }
    if (error.message.includes("ETIMEDOUT") || error.message.includes("timeout")) {
      return "Error: Request to Reg.ru API timed out. Try again.";
    }
    return `Error: ${error.message}`;
  }
  return `Error: Unexpected error occurred: ${String(error)}`;
}
