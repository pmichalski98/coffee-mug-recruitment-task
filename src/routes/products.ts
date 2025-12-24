import { Request, Response, Router } from "express";
import { createProductHandler } from "../handlers/commandHandlers/createProductHandler";
import { getProductsHandler } from "../handlers/queryHandlers/getProductsHandler";
import { validateBody } from "../middleware/validation";
import { createProductSchema } from "../validators/productValidators";

const router = Router();

router.get("/", async (req: Request, res: Response, next) => {
  try {
    const products = await getProductsHandler({});
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  validateBody(createProductSchema),
  async (req: Request, res: Response, next) => {
    try {
      const product = await createProductHandler(req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
