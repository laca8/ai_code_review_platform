import { Router } from "express";
import { analysisController } from "../controllers/analysis.controller";
import { asyncHandler } from "../../../common/middlewares";
import { authenticate } from "../../../common/middlewares/authenticate";

const router = Router();

router.use(authenticate);

// GET  /analysis/history           → كل الـ jobs بتاع اليوزر
router.get(
    "/history",
    asyncHandler((req, res, next) => analysisController.getHistory(req, res, next))
);

// POST /analysis/:repoId/start     → ابدأ تحليل
router.post(
    "/:repoId/start",
    asyncHandler((req, res, next) => analysisController.start(req, res, next))
);

// GET  /analysis/:jobId/status     → حالة الـ job
router.get(
    "/:jobId/status",
    asyncHandler((req, res, next) => analysisController.getStatus(req, res, next))
);

// DELETE /analysis/:jobId/cancel   → إلغاء job pending
router.delete(
    "/:jobId/cancel",
    asyncHandler((req, res, next) => analysisController.cancel(req, res, next))
);

export default router;