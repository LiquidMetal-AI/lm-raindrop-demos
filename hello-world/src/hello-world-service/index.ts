import { services } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';

// simpel service returning hello world
export default class extends services.Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Hello World');
  }
}
