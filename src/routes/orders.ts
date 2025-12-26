import { Request, Response, Router } from "express";
import { createOrderHandler } from "../handlers/commandHandlers/createOrderHandler";
import { validateBody } from "../middleware/validation";
import { createOrderSchema } from "../validators/orderValidators";

const router = Router();

router.post(
  "/",
  validateBody(createOrderSchema),
  async (req: Request, res: Response, next) => {
    try {
      const order = await createOrderHandler(req.body);
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
