import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RegruClient } from "./api/client.js";
import { registerGetRecords } from "./tools/get-records.js";
import { registerAddAlias } from "./tools/add-alias.js";
import { registerAddAaaa } from "./tools/add-aaaa.js";
import { registerAddCname } from "./tools/add-cname.js";
import { registerAddMx } from "./tools/add-mx.js";
import { registerAddTxt } from "./tools/add-txt.js";
import { registerAddNs } from "./tools/add-ns.js";
import { registerAddSrv } from "./tools/add-srv.js";
import { registerAddCaa } from "./tools/add-caa.js";
import { registerRemoveRecord } from "./tools/remove-record.js";
import { registerUpdateRecords } from "./tools/update-records.js";
import { registerUpdateSoa } from "./tools/update-soa.js";
import { registerClearZone } from "./tools/clear-zone.js";

export function createServer(username: string, password: string): McpServer {
  const server = new McpServer({
    name: "regru-mcp-server",
    version: "1.0.0",
  });

  const client = new RegruClient(username, password);

  registerGetRecords(server, client);
  registerAddAlias(server, client);
  registerAddAaaa(server, client);
  registerAddCname(server, client);
  registerAddMx(server, client);
  registerAddTxt(server, client);
  registerAddNs(server, client);
  registerAddSrv(server, client);
  registerAddCaa(server, client);
  registerRemoveRecord(server, client);
  registerUpdateRecords(server, client);
  registerUpdateSoa(server, client);
  registerClearZone(server, client);

  return server;
}
