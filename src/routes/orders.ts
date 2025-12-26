import { Request, Response, Router } from "express";
import { createOrderHandler } from "../handlers/commandHandlers/createOrderHandler";
import { validateBody } from "../middleware/validation";
import { createOrderSchema } from "../validators/orderValidators";
import { HTTP_STATUS } from "../constants";

const router = Router();

router.post(
  "/",
  validateBody(createOrderSchema),
  async (req: Request, res: Response, next) => {
    try {
      const order = await createOrderHandler(req.body);
      res.status(HTTP_STATUS.CREATED).json(order);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
