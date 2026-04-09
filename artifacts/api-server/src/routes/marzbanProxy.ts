import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

async function handleProxy(req: Request, res: Response): Promise<void> {
  const serverUrl = req.headers["x-marzban-server"] as string;
  if (!serverUrl) {
    res.status(400).json({ error: "X-Marzban-Server header required" });
    return;
  }

  const subPath = req.url.replace(/^\/?/, "");
  const targetUrl = `${serverUrl.replace(/\/+$/, "")}/${subPath}`;

  const forwardHeaders: Record<string, string> = {};
  if (req.headers["authorization"]) {
    forwardHeaders["Authorization"] = req.headers["authorization"] as string;
  }

  const hasBody = ["POST", "PUT", "PATCH"].includes(req.method.toUpperCase());
  let bodyContent: string | undefined;

  if (hasBody && req.body) {
    const contentType = (req.headers["content-type"] || "").toLowerCase();

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart")) {
      // OAuth2 form data — forward as URL-encoded (required by Marzban /api/admin/token)
      bodyContent = new URLSearchParams(req.body as Record<string, string>).toString();
      forwardHeaders["Content-Type"] = "application/x-www-form-urlencoded";
    } else {
      // JSON body
      bodyContent = JSON.stringify(req.body);
      forwardHeaders["Content-Type"] = "application/json";
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: bodyContent,
    });

    const contentType = response.headers.get("content-type") || "application/json";
    res.status(response.status);
    res.setHeader("Content-Type", contentType);
    res.send(await response.text());
  } catch (err: any) {
    res.status(502).json({ error: `Marzban sunucusuna ulaşılamadı: ${err.message}` });
  }
}

router.use("/marzban-proxy", handleProxy);

export default router;
