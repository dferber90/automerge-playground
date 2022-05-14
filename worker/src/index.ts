// Worker
import * as Automerge from "automerge";

interface Env {
  CRDT: DurableObjectNamespace;
}

interface Doc {
  counter?: Automerge.Counter;
  items?: { text: string; done: boolean }[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

function binaryResponse(value: Automerge.BinaryDocument) {
  return new Response(value, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/octet-stream",
    },
  });
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      return await handleRequest(request, env);
    } catch (e) {
      return new Response(`${e}`, { headers: corsHeaders });
    }
  },
};

async function handleRequest(request: Request, env: Env) {
  const { pathname } = new URL(request.url);

  let id = env.CRDT.idFromName(pathname.split("/")[1] || "index");
  let obj = env.CRDT.get(id);
  let resp = await obj.fetch(request);
  return resp;
}

// Durable Object
interface CrdtEnv {}

export class Crdt {
  state: DurableObjectState;
  constructor(state: DurableObjectState, env: CrdtEnv) {
    this.state = state;
  }

  // Handle HTTP requests from clients.
  // Handle HTTP requests from clients.
  async fetch(request: Request) {
    switch (request.method) {
      case "POST": {
        let existingValue =
          await this.state.storage.get<Automerge.BinaryDocument>("value");

        const content = await request.blob();
        const buffer = await content.arrayBuffer();
        const incomingView = new Uint8Array(buffer) as Automerge.BinaryDocument;

        if (!existingValue) {
          await this.state.storage.put("value", incomingView);
          return new Response("created", { headers: corsHeaders });
        }

        let mergedDoc = Automerge.merge<Doc>(
          Automerge.load(existingValue),
          Automerge.load(incomingView)
        );
        const nextBuffer = Automerge.save(mergedDoc);
        await this.state.storage.put("value", nextBuffer);
        return new Response("updated", { headers: corsHeaders });
      }
      case "DELETE": {
        await this.state.storage.delete("value");
        return new Response("deleted", { headers: corsHeaders });
      }
      case "GET": {
        let value = await this.state.storage.get<Automerge.BinaryDocument>(
          "value"
        );

        // value exists, return it
        if (value) return binaryResponse(value);

        // value does not exist, create it
        const nextDoc = Automerge.from<Doc>({
          counter: new Automerge.Counter(),
          items: [{ text: "hello from durable object", done: false }],
        });
        const publishableBinary = Automerge.save(nextDoc);
        await this.state.storage.put("value", publishableBinary);
        return binaryResponse(publishableBinary);
      }
      case "OPTIONS":
        return new Response(null, { headers: corsHeaders });
      default:
        return new Response("Not found", { status: 404, headers: corsHeaders });
    }
  }
}
