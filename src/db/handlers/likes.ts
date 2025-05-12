import db from "./../config";

async function addLike(userId: string, postId: string) {
  const sql = db.prepare("INSERT INTO likes (userId, postId) VALUES (?, ?)");
  const result = sql.run(userId, postId);
  return result;
}

async function removeLike(userId: string, postId: string) {
  const sql = db.prepare("DELETE FROM likes  WHERE userId = ? AND postId = ?");
  const result = sql.run(userId, postId);
  return result;
}

export { addLike, removeLike };
