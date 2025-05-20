import db from "./../config";

async function createComment(userId: string, postId: string, content: string) {
  const sql = db.prepare(
    "INSERT INTO comments (userId, postId, content) VALUES (?, ?, ?)"
  );
  const result = sql.run(userId, postId, content);
  return result;
}

async function getCommentsForPost(postId: string) {
  const sql = db.prepare(
    "SELECT c.id, c.userId, c.postId, c.content, c.createdAt, u.username AS authorUsername FROM comments c JOIN users u ON c.userId = u.id WHERE c.postId = ? ORDER BY c.createdAt ASC"
  );
  const result = sql.all(postId);
  return result;
}

async function updateComment(id: number, userId: string, newContent: string) {
  const sql = db.prepare(
    "UPDATE comments SET content = ? WHERE id = ? AND userId = ?"
  );
  const result = sql.run(id, userId, newContent);
  return result;
}

async function deleteComment(id: number, userId: string) {
  const sql = db.prepare("DELETE FROM comments WHERE id = ? AND userId = ?");
  const result = sql.run(id, userId);
  return result;
}

export { createComment, getCommentsForPost, updateComment, deleteComment };
