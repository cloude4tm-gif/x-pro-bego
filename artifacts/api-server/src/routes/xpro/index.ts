import { Router } from "express";
import authRouter from "./auth.js";
import adminRouter from "./adminRoutes.js";
import usersRouter from "./users.js";
import coreRouter from "./core.js";
import systemRouter from "./system.js";
import inboundsRouter from "./inbounds.js";

const router = Router();

router.use(authRouter);
router.use(adminRouter);
router.use(usersRouter);
router.use(coreRouter);
router.use(systemRouter);
router.use(inboundsRouter);

export default router;
