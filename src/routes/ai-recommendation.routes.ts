import { Router } from "express";
import { perfumeRateLimiter } from "../middlewares/rate_limiter";
import { optionalAuthenticate } from "../middlewares/optionalAuth";
import { activityLogger } from "../middlewares/activityLogger";
const {
  getPerfumeRecommendation,
} = require("../controllers/ai-recommendation.controller");

const router = Router();

router
  .route("/recommendation")
  .post(
    optionalAuthenticate
    ,perfumeRateLimiter,activityLogger, getPerfumeRecommendation);

export default router;
