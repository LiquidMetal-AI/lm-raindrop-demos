import { requireAuthenticated, verifyIssuer } from '@liquidmetal-ai/raindrop-framework/core/auth';

/**
 * verify is the application-wide JWT verification hook.
 * @param request The incoming request object.
 * @param env The handler environment object.
 *  **Note**: adds `jwt` property to `env` if verification is successful.
 * @returns true to allow request to continue.
 */
export const verify = verifyIssuer;

/**
 * authorize is the application-wide authorization hook.
 * @param request The incoming request object.
 * @param env The handler environment object with env.jwt set by verify.
 * @returns true if authorized, false otherwise.
 */
export const authorize = requireAuthenticated;
