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

  if (hasBody) {
    const contentType = (req.headers["content-type"] || "").toLowerCase();

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart")) {
      // OAuth2 form data — forward as URL-encoded (required by Marzban /api/admin/token)
      bodyContent = new URLSearchParams(req.body as Record<string, string>).toString();
      forwardHeaders["Content-Type"] = "application/x-www-form-urlencoded";
    } else if (typeof req.body === "string" && req.body.length > 0) {
      // express.text() parsed a plain-text body — check if it's actually JSON
      try {
        JSON.parse(req.body);
        bodyContent = req.body;
        forwardHeaders["Content-Type"] = "application/json";
      } catch {
        bodyContent = req.body;
        forwardHeaders["Content-Type"] = "text/plain;charset=UTF-8";
      }
    } else if (req.body && typeof req.body === "object") {
      // JSON body parsed by express.json()
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
    const responseBody = await response.text();

    // Log non-2xx responses so we can see what Marzban actually returns
    if (!response.ok) {
      req.log?.warn({
        targetUrl,
        method: req.method,
        requestBodyPreview: bodyContent ? bodyContent.slice(0, 200) : "(empty)",
        status: response.status,
        marzbanResponse: responseBody.slice(0, 500),
      }, "Marzban returned error");
    }

    res.status(response.status);
    res.setHeader("Content-Type", contentType);
    res.send(responseBody);
  } catch (err: any) {
    res.status(502).json({ error: `Marzban sunucusuna ulaşılamadı: ${err.message}` });
  }
}

router.use("/marzban-proxy", handleProxy);

export default router;
