import { Router } from "express";
import { requireAuth } from "./middleware.js";
import { readConfig } from "../../lib/xray.js";

const router = Router();

router.get("/inbounds", requireAuth, async (req, res): Promise<void> => {
  try {
    const config = await readConfig();
    const inbounds: Record<string, string[]> = {};

    for (const inbound of config.inbounds || []) {
      const proto = inbound.protocol;
      if (!inbounds[proto]) inbounds[proto] = [];
      inbounds[proto].push(inbound.tag);
    }

    res.json(inbounds);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

export default router;
