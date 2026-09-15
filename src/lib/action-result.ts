export type ActionResult = { error?: string; success?: string; version?: number };

/** Only intentional, user-facing messages may cross the server boundary. */
export class InputError extends Error {}
