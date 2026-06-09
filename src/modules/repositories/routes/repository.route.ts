import { Router } from "express";
import { repositoriesController } from "../controllers/respository.controller";
import { CreateRepositoryDto } from "../dto/repository";
import { validateDto } from "../../../common/validate/validate.dto";
import { asyncHandler } from "../../../common/middlewares";
import { authenticate } from "../../../common/middlewares/authenticate";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
// GitHub webhook — no auth (GitHub calls this directly)
router.post(
    "/handle/webhook",
    asyncHandler((req, res, next) => repositoriesController.handleWebhook(req, res, next))
);

// ── Protected ─────────────────────────────────────────────────────────────────
router.use(authenticate);

// List repos imported from GitHub account
router.get(
    "/github/list",
    asyncHandler((req, res, next) => repositoriesController.listGithubRepos(req, res, next))
);

// CRUD
router.post(
    "/",
    validateDto(CreateRepositoryDto),
    asyncHandler((req, res, next) => repositoriesController.create(req, res, next))
);

router.get(
    "/",
    asyncHandler((req, res, next) => repositoriesController.findAll(req, res, next))
);

router.get(
    "/:id",
    asyncHandler((req, res, next) => repositoriesController.findOne(req, res, next))
);

router.delete(
    "/:id",
    asyncHandler((req, res, next) => repositoriesController.remove(req, res, next))
);

// Webhooks management
router.post(
    "/:id/webhook/enable",
    asyncHandler((req, res, next) => repositoriesController.enableWebhook(req, res, next))
);

router.post(
    "/:id/webhook/disable",
    asyncHandler((req, res, next) => repositoriesController.disableWebhook(req, res, next))
);

export default router;