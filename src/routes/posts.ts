import { Router, type Request, type Response } from "express";
import {
  createPost,
  getBlogPostsByUserId,
  getBlogPostById,
  getAllPublishedPosts,
} from "../db/handlers/posts";
import { tryCatch } from "../lib/lib.ts";
import { isAuthenticated } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: Router = Router();

const UPLOADS_DIR_NAME = "uploads";
const PUBLIC_UPLOADS_PATH = path.join(
  __dirname,
  `../../public/${UPLOADS_DIR_NAME}`
);

fs.mkdirSync(PUBLIC_UPLOADS_PATH, { recursive: true }); // { recursive: true }: If any parent folders (like 'public' or 'uploads') don't exist, create them too.

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // cb: A "callback" function. A note you give back to multer.
    cb(null, PUBLIC_UPLOADS_PATH); // cb(null, ...): The first argument is for errors.
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

  res.status(200).json(posts);
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

  res.status(200).json(posts);
});

router.get("/:postId", isAuthenticated, async (req: Request, res: Response) => {
  const { postId } = req.params;

  if (!postId) {
    res.status(400).json({ message: "Post ID is required." });
    return;
  }

  const { data: post, error: fetchError } = await tryCatch(
    getBlogPostById(postId)
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
    const currentUserId = req.session.user?.id;
    if (post.userId !== currentUserId) {
      res.status(403).json({
        message: "You are not authorized to view this draft post.",
      });
      return;
    }
  }
  res.json(post);
});

export default router;
