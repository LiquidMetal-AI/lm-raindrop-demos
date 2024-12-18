import { services } from "@liquidmetal-ai/raindrop-framework";
import { Env } from "./raindrop.gen";
import { Groq } from "./groq";

export default class extends services.Service<Env> {
  constructor(context: ExecutionContext, env: Env) {
    super(context, env);
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const groq = new Groq({
      apiKey: this.env.GROQ_API_KEY,
    });

    const { haiku } = await groq.haiku({
      about:
        "a group of developers are doing their first hackathon using a product that they created together trying to support each other, be creative, and deepen their understanding of what they have built",
      twist: "half the team spends time on bugfixes",
    });

    return new Response(haiku);
  }
}
