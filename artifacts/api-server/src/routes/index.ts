import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import carbonRouter from "./carbon";
import recommendationsRouter from "./recommendations";
import reportsRouter from "./reports";
import communityRouter from "./community";
import challengesRouter from "./challenges";
import leagueRouter from "./league";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(carbonRouter);
router.use(recommendationsRouter);
router.use(reportsRouter);
router.use(communityRouter);
router.use(challengesRouter);
router.use(leagueRouter);

export default router;
