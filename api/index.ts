import { getExpressApp } from "../server.js";

let appPromise: any = null;

async function getApp() {
  if (!appPromise) {
    appPromise = getExpressApp();
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Express initialization error:", err);
    res.status(500).json({ error: "Failed to initialize serverless backend", details: err.message });
  }
}
