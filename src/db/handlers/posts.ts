import db from "./../config";
import { type BlogPost } from "../types";
import crypto from "crypto";

async function createPost(
  userId: string,
  title: string,
  content: string,
  isPublished: boolean
) {
  const newPostId = crypto.randomUUID();
  const sql = db.prepare(
    "INSERT INTO posts (id, userId, title, content, isPublished) VALUES (?, ?, ?, ?, ?)"
  );
  const dbResult = sql.run(newPostId, userId, title, content, isPublished);

  if (dbResult.changes > 0) {
    return { changes: dbResult.changes, newPostId: newPostId };
  } else {
    return { changes: dbResult.changes, newPostId: null };
  }
}

async function getBlogPostsByUserId(userId: string) {
  const sql = db.prepare(
    "SELECT* FROM posts WHERE userId = ? ORDER BY id DESC"
  );
  const posts = sql.all(userId) as BlogPost[];
  return posts;
}

export { createPost, getBlogPostsByUserId };
