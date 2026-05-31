import { Router, type IRouter } from "express";
import healthRouter from "./health";
import deviceRouter from "./device";
import alertsRouter from "./alerts";
import eventsRouter from "./events";
import dashboardRouter from "./dashboard";
import esp32Router from "./esp32";

const router: IRouter = Router();

router.use(healthRouter);
router.use(deviceRouter);
router.use(alertsRouter);
router.use(eventsRouter);
router.use(dashboardRouter);
router.use(esp32Router);

export default router;
