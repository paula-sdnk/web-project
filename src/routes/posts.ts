import { Router, type Request, type Response } from "express";
import { createPost, getBlogPostsByUserId } from "../db/handlers/posts";
import { tryCatch } from "../lib/lib";
import { isAuthenticated } from "../middleware/auth";

const router: Router = Router();

router.get(
  "/getPosts",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const userId = req.session.user!.id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "User not authenticated properly." });
    }

    try {
      const posts = await getBlogPostsByUserId(userId);
      res.json(posts);
    } catch (error) {
      console.error(`Error fetching posts for user ${userId}:`, error);
      res.status(500).json({ message: "Failed to retrieve your posts." });
    }
  }
);

export default router;
