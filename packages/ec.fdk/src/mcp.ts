import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Fdk } from "./lib/api";
import { fileStorageAdapter } from "./lib/cli-storage";

const server = new McpServer({
  name: "ec.fdk",
  version: "0.8.5",
});

function makeSdk(env: string) {
  return new Fdk({
    env: env as "stage" | "live",
    storageAdapter: fileStorageAdapter,
  }).clean();
}

function cleanItem(item: any) {
  if (!item || typeof item !== "object") return item;
  const { _links, _embedded, ...rest } = item;
  return rest;
}

function cleanResult(result: any) {
  if (!result || typeof result !== "object") return result;
  if (Array.isArray(result.items)) {
    return { ...result, items: result.items.map(cleanItem) };
  }
  return cleanItem(result);
}

server.tool(
  "entryList",
  "List entries from an entrecode datamanager model",
  {
    env: z.enum(["stage", "live"]).default("stage").describe("Environment"),
    dm: z.string().describe("DataManager short ID"),
    model: z.string().describe("Model name"),
    size: z.number().default(5).describe("Page size"),
    page: z.number().optional().describe("Page number"),
    sort: z.string().optional().describe("Sort field"),
  },
  async ({ env, dm, model, size, page, sort }) => {
    const options: Record<string, any> = {};
    if (size) options.size = size;
    if (page) options.page = page;
    if (sort) options.sort = [sort];
    const result = await makeSdk(env).dm(dm).model(model).entryList(options);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "getEntry",
  "Get a single entry by ID",
  {
    env: z.enum(["stage", "live"]).default("stage").describe("Environment"),
    dm: z.string().describe("DataManager short ID"),
    model: z.string().describe("Model name"),
    id: z.string().describe("Entry ID"),
  },
  async ({ env, dm, model, id }) => {
    const result = await makeSdk(env).dm(dm).model(model).getEntry(id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "createEntry",
  "Create a new entry",
  {
    env: z.enum(["stage", "live"]).default("stage").describe("Environment"),
    dm: z.string().describe("DataManager short ID"),
    model: z.string().describe("Model name"),
    data: z.object({}).passthrough().describe("Entry data as JSON object"),
  },
  async ({ env, dm, model, data }) => {
    const result = await makeSdk(env).dm(dm).model(model).createEntry(data);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "editEntry",
  "Edit an existing entry",
  {
    env: z.enum(["stage", "live"]).default("stage").describe("Environment"),
    dm: z.string().describe("DataManager short ID"),
    model: z.string().describe("Model name"),
    id: z.string().describe("Entry ID"),
    data: z.object({}).passthrough().describe("Fields to update as JSON object"),
  },
  async ({ env, dm, model, id, data }) => {
    const result = await makeSdk(env).dm(dm).model(model).editEntry(id, data);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "deleteEntry",
  "Delete an entry",
  {
    env: z.enum(["stage", "live"]).default("stage").describe("Environment"),
    dm: z.string().describe("DataManager short ID"),
    model: z.string().describe("Model name"),
    id: z.string().describe("Entry ID"),
  },
  async ({ env, dm, model, id }) => {
    await makeSdk(env).dm(dm).model(model).deleteEntry(id);
    return { content: [{ type: "text", text: "Entry deleted." }] };
  }
);

server.tool(
  "getSchema",
  "Get the schema of a model (field names, types, requirements)",
  {
    env: z.enum(["stage", "live"]).default("stage").describe("Environment"),
    dm: z.string().describe("DataManager short ID"),
    model: z.string().describe("Model name"),
  },
  async ({ env, dm, model }) => {
    const result = await makeSdk(env).dm(dm).model(model).getSchema();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "dmList",
  "List available datamanagers",
  {
    env: z.enum(["stage", "live"]).default("stage").describe("Environment"),
    size: z.number().default(5).describe("Page size"),
    page: z.number().optional().describe("Page number"),
  },
  async ({ env, size, page }) => {
    const options: Record<string, any> = {};
    if (size) options.size = size;
    if (page) options.page = page;
    const result = cleanResult(await makeSdk(env).dmList(options));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "modelList",
  "List models of a datamanager",
  {
    env: z.enum(["stage", "live"]).default("stage").describe("Environment"),
    dmID: z.string().describe("DataManager long UUID"),
    size: z.number().default(5).describe("Page size"),
    page: z.number().optional().describe("Page number"),
  },
  async ({ env, dmID, size, page }) => {
    const options: Record<string, any> = {};
    if (size) options.size = size;
    if (page) options.page = page;
    const result = cleanResult(await makeSdk(env).dmID(dmID).modelList(options));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "getDatamanager",
  "Get details of a single datamanager",
  {
    env: z.enum(["stage", "live"]).default("stage").describe("Environment"),
    dmID: z.string().describe("DataManager long UUID"),
  },
  async ({ env, dmID }) => {
    const result = cleanResult(await makeSdk(env).getDatamanager(dmID));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
