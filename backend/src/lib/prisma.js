import { PrismaClient } from "@prisma/client";

/**
 * Shared singleton PrismaClient.
 * Import this everywhere instead of creating `new PrismaClient()` inline.
 *
 * Using a function-based lazy initializer to guarantee the client is created
 * AFTER dotenv has populated process.env.DATABASE_URL, avoiding ES-module
 * import-hoisting issues.
 */
let _prisma = null;

export function getPrisma() {
    if (!_prisma) {
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL is not set. Check your .env file.");
        }
        _prisma = new PrismaClient();
    }
    return _prisma;
}

// Also export the getter as a Proxy so existing `prisma.xxx` call-sites work
// by just doing:  import prisma from "../lib/prisma.js"
const prismaProxy = new Proxy(
    {},
    {
        get(_target, prop) {
            return getPrisma()[prop];
        },
    }
);

export default prismaProxy;
