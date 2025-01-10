import { Router } from "express";
import { perfumeRateLimiter } from "../middlewares/rate_limiter";
const {
  getPerfumeRecommendation,
} = require("../controllers/ai-recommendation.controller");

const router = Router();

router
  .route("/recommendation")
  .post(perfumeRateLimiter, getPerfumeRecommendation);

export default router;
