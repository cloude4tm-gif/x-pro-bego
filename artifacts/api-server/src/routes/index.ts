import { Router, type IRouter } from "express";
import healthRouter from "./health";
import plansRouter from "./plans";
import resellersRouter from "./resellers";
import apiKeysRouter from "./apiKeys";
import ipRulesRouter from "./ipRules";
import auditLogsRouter from "./auditLogs";
import webhooksRouter from "./webhooks";
import botSettingsRouter from "./botSettings";
import automationRouter from "./automation";
import analyticsRouter from "./analytics";
import marzbanProxyRouter from "./marzbanProxy";

const router: IRouter = Router();

router.use(healthRouter);
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
