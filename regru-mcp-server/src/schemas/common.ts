import { z } from "zod";

export const domainSchema = z
  .string()
  .min(1, "Domain name is required")
  .max(253, "Domain name too long")
  .regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
    "Invalid domain name format (e.g., example.com)"
  )
  .describe("Fully qualified domain name (e.g., example.com)");

export const subdomainSchema = z
  .string()
  .min(1, "Subdomain is required")
  .max(253, "Subdomain too long")
  .regex(
    /^(@|\*|[a-zA-Z0-9]([a-zA-Z0-9._-]{0,61}[a-zA-Z0-9])?)$/,
    "Invalid subdomain format. Use '@' for root, '*' for wildcard, or a valid subdomain name"
  )
  .describe("Subdomain name. Use '@' for root domain, '*' for wildcard");

export const ipv4Schema = z
  .string()
  .regex(
    /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
    "Invalid IPv4 address format (e.g., 192.168.1.1)"
  )
  .describe("IPv4 address (e.g., 192.168.1.1)");

export const ipv6Schema = z
  .string()
  .regex(
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?::(([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})?$/,
    "Invalid IPv6 address format"
  )
  .describe("IPv6 address (e.g., 2001:0db8:85a3::8a2e:0370:7334)");

export const ttlSchema = z
  .number()
  .int("TTL must be an integer")
  .min(60, "TTL minimum is 60 seconds")
  .max(86400, "TTL maximum is 86400 seconds (24 hours)")
  .default(3600)
  .describe("Time to live in seconds (60-86400, default: 3600)");

export const prioritySchema = z
  .number()
  .int("Priority must be an integer")
  .min(0, "Priority minimum is 0")
  .max(65535, "Priority maximum is 65535")
  .describe("Priority value (0-65535, lower = higher priority)");

export const recordTypeSchema = z
  .enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA", "SOA"])
  .describe("DNS record type");
