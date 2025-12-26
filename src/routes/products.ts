import { Request, Response, Router } from "express";
import { createProductHandler } from "../handlers/commandHandlers/createProductHandler";
import { restockProductHandler } from "../handlers/commandHandlers/restockProductHandler";
import { sellProductHandler } from "../handlers/commandHandlers/sellProductHandler";
import { getProductsHandler } from "../handlers/queryHandlers/getProductsHandler";
import { validateBody, validateParams } from "../middleware/validation";
import {
  createProductSchema,
  restockProductSchema,
  sellProductSchema,
  productIdParamSchema,
} from "../validators/productValidators";
import { HTTP_STATUS } from "../constants";

const router = Router();

router.get("/", async (req: Request, res: Response, next) => {
  try {
    const products = await getProductsHandler({});
    res.status(HTTP_STATUS.OK).json(products);
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
      res.status(HTTP_STATUS.CREATED).json(product);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/restock",
  validateParams(productIdParamSchema),
  validateBody(restockProductSchema),
  async (req: Request, res: Response, next) => {
    try {
      const product = await restockProductHandler({
        productId: req.params.id,
        amount: req.body.amount,
      });
      res.status(HTTP_STATUS.OK).json(product);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/sell",
  validateParams(productIdParamSchema),
  validateBody(sellProductSchema),
  async (req: Request, res: Response, next) => {
    try {
      const product = await sellProductHandler({
        productId: req.params.id,
        amount: req.body.amount,
      });
      res.status(HTTP_STATUS.OK).json(product);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
