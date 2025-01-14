import { Router } from "express";
import { perfumeRateLimiter } from "../middlewares/rate_limiter";
import { optionalAuthenticate } from "../middlewares/optionalAuth";
const {
  getPerfumeRecommendation,
} = require("../controllers/ai-recommendation.controller");

const router = Router();

router
  .route("/recommendation")
  .post(
    optionalAuthenticate
    ,perfumeRateLimiter, getPerfumeRecommendation);

export default router;
