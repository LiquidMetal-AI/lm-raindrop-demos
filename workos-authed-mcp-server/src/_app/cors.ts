import { corsDisabled } from '@liquidmetal-ai/raindrop-framework/core/cors';

/**
 * cors is the application-wide CORS (Cross-Origin Resource Sharing) handler.
 *
 * This handler is automatically applied to all HTTP services in your application.
 * You can override this per-handler by exporting a `cors` function from your handler.
 *
 * **Default Behavior (Secure):**
 * By default, CORS is disabled for security. Browsers will block cross-origin requests
 * to your API unless you explicitly configure allowed origins.
 *
 * **When to Enable CORS:**
 * Enable CORS when you need to allow web applications from different domains to access
 * your API (e.g., a frontend at https://app.example.com calling an API at https://api.example.com).
 *
 * @example Allow all origins (public API - use with caution)
 * ```typescript
 * import { corsAllowAll } from '@liquidmetal-ai/raindrop-framework/core/cors';
 * export const cors = corsAllowAll;
 * ```
 *
 * @example Allow specific origins (recommended for production)
 * ```typescript
 * import { createCorsHandler } from '@liquidmetal-ai/raindrop-framework/core/cors';
 * export const cors = createCorsHandler({
 *   origin: ['https://example.com', 'https://app.example.com'],
 *   allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
 *   allowHeaders: ['Content-Type', 'Authorization'],
 *   credentials: true,  // Allow cookies/auth headers
 *   maxAge: 86400       // Cache preflight for 24 hours
 * });
 * ```
 *
 * @example Dynamic origin validation
 * ```typescript
 * import { createCorsHandler } from '@liquidmetal-ai/raindrop-framework/core/cors';
 * export const cors = createCorsHandler({
 *   origin: (request, env) => {
 *     const origin = request.headers.get('origin');
 *     // Check against database, environment variable, or custom logic
 *     const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [];
 *     return allowedOrigins.includes(origin || '') ? origin : null;
 *   },
 *   credentials: true
 * });
 * ```
 *
 * @example Custom handler for advanced control
 * ```typescript
 * export const cors = (request: Request, env: any, response?: Response): Response => {
 *   // Custom CORS logic with access to env
 *   if (!response) {
 *     // Handle OPTIONS preflight
 *     return new Response(null, { status: 204, headers: { ... } });
 *   }
 *   // Add headers to response, can use env.ALLOWED_ORIGINS, env.db, etc.
 *   const headers = new Headers(response.headers);
 *   headers.set('Access-Control-Allow-Origin', '*');
 *   return new Response(response.body, { ...response, headers });
 * };
 * ```
 */
export const cors = corsDisabled;
