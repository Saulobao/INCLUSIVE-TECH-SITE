import { Router, type IRouter } from "express";
import { requireAuth } from "../middleware/requireAuth";
import healthRouter from "./health";
import authRouter from "./auth";
import deviceRouter from "./device";
import alertsRouter from "./alerts";
import eventsRouter from "./events";
import dashboardRouter from "./dashboard";
import esp32Router from "./esp32";

const router: IRouter = Router();

// Public: health check and auth
router.use(healthRouter);
router.use(authRouter);

// ESP32 endpoints (use x-api-key, not session)
router.use(esp32Router);

// All remaining routes require a valid session
router.use(requireAuth);
router.use(deviceRouter);
router.use(alertsRouter);
router.use(eventsRouter);
router.use(dashboardRouter);

export default router;
