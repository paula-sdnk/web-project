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
  const selectPost =
    "p.id, p.userId, p.title, p.content, p.isPublished, p.dateCreated, p.attachmentPath, u.username AS authorUsername";
  const selectLikeCount =
    "SELECT COUNT(*) FROM likes WHERE likes.postId = p.id";
  const selectIsLikedByUser =
    "SELECT COUNT(*) FROM likes WHERE likes.postId = p.id AND likes.userId = ?";
  const selectCommentCount =
    "SELECT COUNT(*) FROM comments WHERE comments.postId = p.id";
  const sql = db.prepare(
    `SELECT ${selectPost}, (${selectLikeCount}) AS likeCount, (${selectIsLikedByUser}) AS currentUserLiked, (${selectCommentCount}) as commentCount FROM posts p JOIN users u ON p.userId = u.id WHERE p.userId = ? ORDER BY p.dateCreated DESC`
  );
  const posts = sql.all(userId, userId) as BlogPost[];
  return posts;
}

async function getAllPublishedPosts(userId: string) {
  const selectPost =
    "p.id, p.userId, p.title, p.content, p.isPublished, p.dateCreated, p.attachmentPath, u.username AS authorUsername";
  const selectLikeCount =
    "SELECT COUNT(*) FROM likes WHERE likes.postId = p.id";
  const selectIsLikedByUser =
    "SELECT COUNT(*) FROM likes WHERE likes.postId = p.id AND likes.userId = ?";
  const selectCommentCount =
    "SELECT COUNT(*) FROM comments WHERE comments.postId = p.id";

  const sql = db.prepare(
    `SELECT ${selectPost}, (${selectLikeCount}) AS likeCount, (${selectIsLikedByUser}) AS currentUserLiked, (${selectCommentCount}) as commentCount FROM posts p JOIN users u ON p.userId = u.id WHERE p.isPublished = 1 ORDER BY p.dateCreated DESC`
  );

  const posts = sql.all(userId) as BlogPost[];
  console.log(posts);
  return posts;
}

async function getBlogPostById(userId: string, id: string) {
  const selectPost =
    "p.id, p.userId, p.title, p.content, p.isPublished, p.dateCreated, p.attachmentPath, u.username AS authorUsername";
  const selectLikeCount =
    "SELECT COUNT(*) FROM likes WHERE likes.postId = p.id";
  const selectIsLikedByUser =
    "SELECT COUNT(*) FROM likes WHERE likes.postId = p.id AND likes.userId = ?";
  const selectCommentCount =
    "SELECT COUNT(*) FROM comments WHERE comments.postId = p.id";

  const sql = db.prepare(
    `SELECT ${selectPost}, (${selectLikeCount}) AS likeCount, (${selectIsLikedByUser}) AS currentUserLiked, (${selectCommentCount}) as commentCount FROM posts p JOIN users u ON p.userId = u.id WHERE p.id = ?`
  );

  const post = sql.get(userId, id) as BlogPost | undefined;
  return post || null;
}

async function updatePost(
  postId: string,
  title: string,
  content: string,
  isPublished: number,
  attachmentPath: string | null
) {
  const sql = await db.prepare(
    `UPDATE posts SET title = ?, content = ?, isPublished = ?, attachmentPath = ? WHERE id = ?`
  );
  const result = sql.run(title, content, isPublished, attachmentPath, postId);
  return result;
}

async function deletePost(postId: string) {
  const sql = db.prepare("DELETE FROM posts WHERE id = ?");
  const result = sql.run(postId);
  return result;
}

export {
  createPost,
  getBlogPostsByUserId,
  getAllPublishedPosts,
  getBlogPostById,
  updatePost,
  deletePost,
};
