import { Router } from "express";
import { requireAuth } from "./middleware.js";
import {
  readConfig, saveConfig, restartCore,
  getCoreVersion, getCoreRunning, writeConfigToFile
} from "../../lib/xray.js";

const router = Router();

router.get("/core", requireAuth, async (req, res): Promise<void> => {
  try {
    const version = await getCoreVersion();
    const running = await getCoreRunning();
    res.json({ version, started: running ? new Date().toISOString() : null });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.get("/core/config", requireAuth, async (req, res): Promise<void> => {
  try {
    const config = await readConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.put("/core/config", requireAuth, async (req, res): Promise<void> => {
  try {
    let config = req.body;
    if (typeof config === "string") {
      try { config = JSON.parse(config); } catch {
        res.status(422).json({ detail: "Invalid JSON config" });
        return;
      }
    }
    await saveConfig(config);
    await writeConfigToFile();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.post("/core/restart", requireAuth, async (req, res): Promise<void> => {
  try {
    await restartCore();
    res.json({ detail: "Core restarted successfully" });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

router.get("/core/stats", requireAuth, async (req, res): Promise<void> => {
  res.json({ version: await getCoreVersion() });
});

export default router;
