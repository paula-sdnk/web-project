import db from "./../config";
import { type BlogPost } from "../types";
import crypto from "crypto";

async function createPost(
  userId: string,
  title: string,
  content: string,
  isPublished: number,
  attachmentPath?: string | null
) {
  const newPostId = crypto.randomUUID();
  const attachmentPathForDb: string | null =
    attachmentPath === undefined ? null : attachmentPath;

  const sql = db.prepare(
    "INSERT INTO posts (id, userId, title, content, isPublished, attachmentPath) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const dbResult = sql.run(
    newPostId,
    userId,
    title,
    content,
    isPublished,
    attachmentPathForDb
  );

  if (dbResult.changes > 0) {
    return { changes: dbResult.changes, newPostId: newPostId };
  } else {
    return { changes: dbResult.changes, newPostId: null };
  }
}

async function getBlogPostsByUserId(userId: string) {
  const sql = db.prepare(
    "SELECT p.id, p.userId, p.title, p.content, p.isPublished, p.dateCreated, p.attachmentPath, u.username AS authorUsername, (SELECT COUNT(*) FROM likes WHERE likes.postId = p.id) AS likeCount, EXISTS (SELECT 1 FROM likes WHERE likes.postId = p.id AND likes.userId = p.userId) AS currentUserLiked FROM posts p JOIN users u ON p.userId = u.id WHERE p.userId = ? ORDER BY p.dateCreated DESC"
  );
  const posts = sql.all(userId) as BlogPost[];
  return posts;
}

async function getAllPublishedPosts(userId: string) {
  const selectPost =
    "p.id, p.userId, p.title, p.content, p.isPublished, p.dateCreated, p.attachmentPath, u.username AS authorUsername";
  const selectLikeCount =
    "SELECT COUNT(*) FROM likes WHERE likes.postId = p.id";
  const selectIsLikedByUser =
    "SELECT COUNT(*) FROM likes WHERE likes.postId = p.id AND likes.userId = ?";

  const sql = db.prepare(
    `SELECT ${selectPost}, (${selectLikeCount}) AS likeCount, (${selectIsLikedByUser}) AS currentUserLiked FROM posts p JOIN users u ON p.userId = u.id WHERE p.isPublished = 1 ORDER BY p.dateCreated DESC`
  );

  const posts = sql.all(userId) as BlogPost[];
  console.log(posts);
  return posts;
}

async function getBlogPostById(id: string) {
  const sql = db.prepare(
    "SELECT p.id, p.userId, p.title, p.content, p.isPublished, p.dateCreated, p.attachmentPath, u.username AS authorUsername, (SELECT COUNT(*) FROM likes WHERE likes.postId = p.id) AS likeCount, EXISTS (SELECT 1 FROM likes WHERE likes.postId = p.id AND likes.userId = p.userId) AS currentUserLiked FROM posts p JOIN users u ON p.userId = u.id WHERE p.id = ?"
  );
  const post = sql.get(id) as BlogPost | undefined;
  return post || null;
}

export {
  createPost,
  getBlogPostsByUserId,
  getAllPublishedPosts,
  getBlogPostById,
};
