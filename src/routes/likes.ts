import { Router, type Request, type Response } from "express";
import { isAuthenticated } from "../middleware/auth";
import { addLike, removeLike } from "../db/handlers/likes.ts";
import { tryCatch } from "../lib/lib.ts";

const router: Router = Router();

router.post(
  "/:postId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { postId } = req.params;

    if (!postId) {
      res.status(400).json({ message: "Post ID is required." });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: "User not authenticated." });
      return;
    }

    const { data: result, error: sqliteError } = await tryCatch(
      addLike(userId, postId)
    );

    if (sqliteError) {
      console.error(
        `Error liking post ${postId} for user ${userId}:`,
        sqliteError
      );
      res.status(500).json({
        message: "Failed to like post due to a database error.",
      });
      return;
    }
    res.status(201).json({ message: "Post liked successfully." });
  }
);

router.delete(
  "/:postId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { postId } = req.params;

    if (!postId) {
      res.status(400).json({ message: "Post ID is required." });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: "User not authenticated." });
      return;
    }

    const { data: result, error: sqliteError } = await tryCatch(
      removeLike(userId, postId)
    );

    if (sqliteError) {
      console.error(
        `Error unliking post ${postId} for user ${userId}:`,
        sqliteError
      );
      res
        .status(500)
        .json({ message: "Failed to unlike post due to a database error." });
      return;
    }
    res.status(201).json({ message: "Post unliked successfully." });
  }
);

export default router;
