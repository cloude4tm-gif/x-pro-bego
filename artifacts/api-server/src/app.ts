import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { db, xrayConfigTable } from "@workspace/db";
import fs from "fs/promises";
import { XRAY_CONFIG_PATH, defaultXrayConfig } from "./lib/xray.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.text({ type: "text/plain", limit: "10mb" }));

app.use("/api", router);

async function initXrayConfig() {
  try {
    const rows = await db.select().from(xrayConfigTable).limit(1);
    if (rows.length === 0) {
      let config = defaultXrayConfig();
      try {
        const fileContent = await fs.readFile(XRAY_CONFIG_PATH, "utf-8");
        config = JSON.parse(fileContent);
        logger.info({ path: XRAY_CONFIG_PATH }, "Xray config dosyadan yüklendi ve DB'ye kaydedildi");
      } catch {
        logger.info("Xray config dosyası bulunamadı, varsayılan config DB'ye kaydediliyor");
      }
      await db.insert(xrayConfigTable).values({ configJson: config as any });
    }
  } catch (err: any) {
    logger.warn({ err: err.message }, "Xray config init hatası");
  }
}

initXrayConfig();

export default app;
