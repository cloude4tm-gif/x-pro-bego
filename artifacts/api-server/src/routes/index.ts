import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import plansRouter from "./plans.js";
import resellersRouter from "./resellers.js";
import apiKeysRouter from "./apiKeys.js";
import ipRulesRouter from "./ipRules.js";
import auditLogsRouter from "./auditLogs.js";
import webhooksRouter from "./webhooks.js";
import botSettingsRouter from "./botSettings.js";
import automationRouter from "./automation.js";
import analyticsRouter from "./analytics.js";
import marzbanProxyRouter from "./marzbanProxy.js";
import xproRouter from "./xpro/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(xproRouter);
router.use(marzbanProxyRouter);
router.use(plansRouter);
router.use(resellersRouter);
router.use(apiKeysRouter);
router.use(ipRulesRouter);
router.use(auditLogsRouter);
router.use(webhooksRouter);
router.use(botSettingsRouter);
router.use(automationRouter);
router.use(analyticsRouter);

export default router;
