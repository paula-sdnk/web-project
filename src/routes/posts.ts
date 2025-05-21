import { Router, type Request, type Response } from "express";
import {
  createPost,
  getBlogPostsByUserId,
  getBlogPostById,
  getAllPublishedPosts,
  updatePost,
  deletePost,
} from "../db/handlers/posts";
import { tryCatch } from "../lib/lib.ts";
import { isAuthenticated } from "../middleware/auth";
import { isAdmin } from "../db/utils/isAdmin.ts";
import db from "../db/config.ts";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: Router = Router();

const UPLOADS_DIR_NAME = "uploads";
const PUBLIC_UPLOADS_PATH = path.join(
  __dirname,
  `../../public/${UPLOADS_DIR_NAME}`
);

fs.mkdirSync(PUBLIC_UPLOADS_PATH, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // cb: callback function. A note to give back to multer
    cb(null, PUBLIC_UPLOADS_PATH); // cb(null, ...): The first argument is for errors
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename =
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname);

    cb(null, filename);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/gif"
  ) {
    cb(null, true);
    return;
  }
  cb(new Error("Invalid file type. Only JPG, PNG, or GIF images are allowed."));
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

async function isPostAuthor(req: Request, postId: string) {
  const userId = req.session.user?.id;
  if (!userId) {
    return false;
  }
  try {
    const sql = await db.prepare("SELECT userId FROM posts WHERE id = ?");
    const post = (await sql.get(postId)) as null | { userId: string };
    if (!post) {
      return false;
    }
    return post.userId === userId;
  } catch (error) {
    console.error(`Error checking if user is author of post ${postId}:`, error);
    return false;
  }
}

router.post(
  "/create",
  isAuthenticated,
  upload.single("attachment"),
  async (req: Request, res: Response) => {
    const userId = req.session.user!.id;

    const { title, content } = req.body;

    const isPublishedDb: number = req.body.isPublished === "true" ? 1 : 0;

    if (!req.file) {
      console.log("No file was processed by Multer (req.file is undefined).");
    }

    let attachmentPath: string | null = null;
    if (req.file) {
      attachmentPath = `/uploads/${req.file.filename}`;
      console.log("File processed by Multer. Filename:", req.file.filename);
      console.log("Path constructed for DB:", attachmentPath);
    }

    if (!title || !content) {
      res.status(400).json({ message: "Title and content are required." });
      return;
    }

    if (!userId) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(401).json({ message: "User not authenticated properly." });
      return;
    }

    const { data: createResult, error: sqliteError } = await tryCatch(
      createPost(userId, title, content, isPublishedDb, attachmentPath)
    );

    if (sqliteError) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error("Error creating post in database:", sqliteError);
      res.status(500).json({
        message: "Failed to save post due to database error.",
      });
      return;
    }

    res.status(201).json({
      message: "Post created successfully!",
      postId: createResult.newPostId,
    });
  }
);

router.get("/", isAuthenticated, async (req: Request, res: Response) => {
  const userId = req.session.user!.id;
  if (!userId) {
    res.status(401).json({ message: "User not authenticated properly." });
    return;
  }

  const { data: posts, error: fetchError } = await tryCatch(
    getAllPublishedPosts(userId)
  );

  if (fetchError) {
    console.error(`Error fetching posts for user ${userId}:`, fetchError);
    res.status(500).json({ message: "Failed to retrieve your posts." });
    return;
  }

  const isAdminUser = await isAdmin(req);

  const postsWithPermissions = posts.map((post: any) => {
    const isAuthor = userId !== null && userId === post.userId;
    const canDelete = userId !== null && (isAuthor || isAdminUser);

    return {
      ...post,
      canDelete: canDelete,
    };
  });
  res.status(200).json(postsWithPermissions);
});

router.get("/my", isAuthenticated, async (req: Request, res: Response) => {
  const userId = req.session.user!.id;

  if (!userId) {
    res.status(401).json({ message: "User not authenticated properly." });
    return;
  }

  const { data: posts, error: fetchError } = await tryCatch(
    getBlogPostsByUserId(userId)
  );

  if (fetchError) {
    console.error(`Error fetching posts for user ${userId}:`, fetchError);
    res.status(500).json({ message: "Failed to retrieve your posts." });
    return;
  }

  const isAdminUser = await isAdmin(req);

  const postsWithPermissions = posts.map((post: any) => {
    const isAuthor = userId !== null && userId === post.userId;
    const canDelete = userId !== null && (isAuthor || isAdminUser);

    return {
      ...post,
      canDelete: canDelete,
    };
  });

  res.status(200).json(postsWithPermissions);
});

router.get("/:postId", isAuthenticated, async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = req.session.user!.id;

  if (!postId) {
    res.status(400).json({ message: "Post ID is required." });
    return;
  }

  const { data: post, error: fetchError } = await tryCatch(
    getBlogPostById(userId, postId)
  );

  if (fetchError) {
    console.error(`Error fetching post with ID ${postId}:`, fetchError);
    res.status(500).json({ message: "Failed to retrieve the post." });
    return;
  }

  if (!post) {
    res.status(404).json({ message: "Post not found." });
    return;
  }

  if (post.isPublished === 0) {
    const isAuthor = post.userId === userId;
    const isAdminUser = await isAdmin(req);

    if (!isAuthor && !isAdminUser) {
      res.status(403).json({
        message: "You are not authorized to view this draft post.",
      });
      return;
    }
  }

  const isAdminUser = await isAdmin(req);
  const isAuthor = userId !== null && userId === post.userId;

  const canDelete = userId !== null && (isAuthor || isAdminUser);

  const postWithPermissions = {
    ...post,
    canDelete: canDelete,
  };

  res.json(postWithPermissions);
});

router.put("/:postId", isAuthenticated, async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { title, content, isPublished, attachmentPath } = req.body;
  const userId = req.session.user!.id;

  const isPublishedDb: number = req.body.isPublished === "true" ? 1 : 0;

  if (!postId) {
    res.status(400).json({ message: "Post ID is required in the URL." });
    return;
  }

  if (!title || !content || isPublishedDb === undefined) {
    res.status(400).json({
      message: "Title, content and published status are required.",
    });
    return;
  }

  if (isNaN(isPublishedDb) || (isPublishedDb !== 0 && isPublishedDb !== 1)) {
    res.status(400).json({ message: "Invalid published status." });
    return;
  }

  const { data: existingPost, error: fetchError } = await tryCatch(
    getBlogPostById(userId, postId)
  );

  if (fetchError) {
    console.error(
      `Error fetching existing post ${postId} for update authorization:`,
      fetchError
    );
    res
      .status(500)
      .json({ message: "Failed to fetch post for authorization." });
    return;
  }

  if (!existingPost) {
    res.status(404).json({ message: "Post not found." });
    return;
  }

  const isAuthorOfThisPost = userId === existingPost.userId;

  const isAuthorizedToEdit =
    isAuthorOfThisPost && existingPost.isPublished === 0;

  if (!isAuthorizedToEdit) {
    res
      .status(403)
      .json({ message: "You are not authorized to edit this post." });
    return;
  }

  const { data: updateResult, error: dbError } = await tryCatch(
    updatePost(postId, title, content, isPublished, attachmentPath)
  );

  if (dbError) {
    console.error(`Error updating post ${postId}:`, dbError);
    res
      .status(500)
      .json({ message: "Failed to update post due to a server error." });
    return;
  }

  res.status(200).json({ message: "Post updated successfully." });
});

router.delete(
  "/:postId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const { postId } = req.params;

    if (!postId) {
      res.status(400).json({ message: "Post ID is required to delete." });
      return;
    }

    const isAuthor = await isPostAuthor(req, postId);
    const isAdminUser = await isAdmin(req);

    if (!isAuthor && !isAdminUser) {
      res
        .status(403)
        .json({ message: "You are not authorized to delete this post." });
      return;
    }

    const { data: deletedPost, error: dbError } = await tryCatch(
      deletePost(postId)
    );

    if (dbError) {
      console.error(`Error deleting post ${postId}:`, dbError);
      res
        .status(500)
        .json({ message: "Failed to delete comment due to a server error." });
      return;
    }

    if (!deletedPost) {
      res.status(400).json({ message: "Post not found." });
      return;
    }

    res.status(200).json({ message: "Post deleted successfully." });
  }
);

export default router;
