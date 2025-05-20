import { Router, type Request, type Response } from "express";
import { isAuthenticated } from "../middleware/auth";
import {
  createComment,
  getCommentsForPost,
  updateComment,
  deleteComment,
} from "../db/handlers/comments.ts";
import { tryCatch } from "../lib/lib.ts";
import { isAdmin } from "../db/utils/isAdmin.ts";

const router: Router = Router();

router.get("/:postId", isAuthenticated, async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.session.user?.id;

  if (!postId) {
    res.status(400).json({ message: "Post ID is required to fetch comments." });
    return;
  }

  const { data: comments, error: dbError } = await tryCatch(
    getCommentsForPost(postId)
  );

  if (dbError) {
    console.error(`Error fetching comments for post ${postId}:`, dbError);
    res.status(500).json({ message: "Failed to retrieve comments." });
    return;
  }

  const isAdminUser = await isAdmin(req);

  const commentsWithPermissions = comments.map((comment: any) => {
    const isAuthor = userId === comment.userId;

    const canDelete = isAuthor || isAdminUser;

    return {
      ...comment,
      canDelete: canDelete,
    };
  });

  res.status(200).json(commentsWithPermissions);
});

router.post(
  "/create/:postId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { postId } = req.params;
    const { content } = req.body;

    if (!postId) {
      res
        .status(400)
        .json({ message: "Post ID is required to create a comment." });
      return;
    }
    if (!content || content.trim().length === 0) {
      res.status(400).json({ message: "Comment content is required." });
      return;
    }

    const { data: newComment, error: dbError } = await tryCatch(
      createComment(userId, postId, content.trim())
    );

    if (dbError) {
      console.error(
        `Error creating comment for post ${postId} by user ${userId}:`,
        dbError
      );
      res
        .status(500)
        .json({ message: "Failed to create comment due to a server error." });
      return;
    }
    if (newComment) {
      res.status(201).json({ message: "Comment created successfully!" });
    }
  }
);

router.put(
  "/:commentId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId) {
      res.status(400).json({ message: "Comment ID is required in the URL." });
      return;
    }
    const commentIdNumber = Number(commentId);
    if (isNaN(commentIdNumber)) {
      res.status(400).json({ message: "Invalid Comment ID format." });
      return;
    }

    if (!content || content.trim().length === 0) {
      res.status(400).json({ message: "New comment content is required." });
      return;
    }

    const { data: updatedComment, error: dbError } = await tryCatch(
      updateComment(commentIdNumber, userId, content.trim())
    );

    if (dbError) {
      console.error(
        `Error updating comment ${commentId} for user ${userId}:`,
        dbError
      );
      res
        .status(500)
        .json({ message: "Failed to update comment due to a server error." });
      return;
    }

    if (updatedComment) {
      res.status(200).json({ message: "Comment updated successfully." });
    }
  }
);

router.delete(
  "/:commentId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const userId = req.session.user!.id;
    const { commentId } = req.params;

    if (!commentId) {
      res.status(400).json({ message: "Comment ID is required to delete." });
      return;
    }

    const commentIdNumber = Number(commentId);
    if (isNaN(commentIdNumber)) {
      res.status(400).json({ message: "Invalid Comment ID format." });
      return;
    }

    const { data: deletedComment, error: dbError } = await tryCatch(
      deleteComment(commentIdNumber, userId)
    );

    if (dbError) {
      console.error(
        `Error deleting comment ${commentId} for user ${userId}:`,
        dbError
      );
      res
        .status(500)
        .json({ message: "Failed to delete comment due to a server error." });
      return;
    }

    if (!deletedComment) {
      res.status(400).json({ message: "Comment not found." });
      return;
    }

    res.status(200).json({ message: "Comment deleted successfully." });
  }
);
export default router;
