import db from "./../config";
import { type BlogPost } from "../types";

async function createPost(
  userId: number,
  title: string,
  content: string,
  isPublished: boolean
) {
  const sql = db.prepare(
    "INSERT INTO posts (userId, title, content, isPublished) VALUES (?, ?, ?, ?)"
  );
  return sql.run(userId, title, content, isPublished);
}

async function getBlogPostsByUserId(userId: number) {
  const sql = db.prepare(
    "SELECT* FROM posts WHERE userId = ? ORDER BY id DESC"
  );
  const posts = sql.all(userId) as BlogPost[];
  return posts;
}

export { createPost, getBlogPostsByUserId };
