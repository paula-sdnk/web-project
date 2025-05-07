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

router.post(
  "createPost",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const userId = req.session.user!.id;

    const { title, content } = req.body;
    const isPublished = req.body.isPublished === true;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required." });
    }

    if (!userId) {
      return res
        .status(401)
        .json({ message: "User not authenticated properly." });
    }

    const { data: createResult, error: sqliteError } = await tryCatch(
      createPost(userId, title, content, isPublished)
    );

    if (sqliteError) {
      console.error("Error creating post in database:", sqliteError);
      return res.status(500).json({
        message: "Failed to save post due to database error.",
      });
    }

    res.status(201).json({
      message: "Post created successfully!",
      postId: createResult.newPostId,
    });
  }
);

export default router;
