import { Router } from "express";
import type { Request, Response, NextFunction } from "express";

const router = Router();

async function handleProxy(req: Request, res: Response): Promise<void> {
  const serverUrl = req.headers["x-marzban-server"] as string;
  if (!serverUrl) {
    res.status(400).json({ error: "X-Marzban-Server header required" });
    return;
  }

  const subPath = req.url.replace(/^\/?/, "");
  const targetUrl = `${serverUrl.replace(/\/+$/, "")}/${subPath}`;

  const forwardHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (req.headers["authorization"]) {
    forwardHeaders["Authorization"] = req.headers["authorization"] as string;
  }

  const hasBody = ["POST", "PUT", "PATCH"].includes(req.method.toUpperCase());

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: hasBody ? JSON.stringify(req.body) : undefined,
    });

    const contentType = response.headers.get("content-type") || "application/json";
    res.status(response.status);
    res.setHeader("Content-Type", contentType);

    const text = await response.text();
    res.send(text);
  } catch (err: any) {
    res.status(502).json({ error: `Marzban sunucusuna ulaşılamadı: ${err.message}` });
  }
}

router.use("/marzban-proxy", handleProxy);

export default router;
