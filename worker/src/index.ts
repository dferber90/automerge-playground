// Worker
import * as Automerge from "automerge";

type Env = {
  CRDT: DurableObjectNamespace;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

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

  let id = env.CRDT.idFromName(pathname.split("/")[1] || "A");
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
        const content = await request.blob();
        const buffer = await content.arrayBuffer();
        await this.state.storage.put("value", buffer);
        return new Response("posted", { headers: corsHeaders });
      }
      case "GET": {
        let value = await this.state.storage.get<Automerge.BinaryDocument>(
          "value"
        );

        if (value) {
          return new Response(value, {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/octet-stream",
            },
          });
        }

        let doc = Automerge.init<{
          counter?: Automerge.Counter;
          items?: { text: string; done: boolean }[];
        }>();

        const nextDoc = Automerge.change(doc, (doc) => {
          if (!doc.counter) doc.counter = new Automerge.Counter();
          doc.counter.increment();
          doc.items = [{ text: "hello from durable object", done: false }];
        });

        const publishableBinary = Automerge.save(nextDoc);

        return new Response(publishableBinary, {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/octet-stream",
          },
        });
      }
      case "OPTIONS":
        return new Response(null, { headers: corsHeaders });
      default:
        return new Response("Not found", { status: 404, headers: corsHeaders });
    }
  }
}
