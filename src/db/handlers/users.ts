import db from "./../config";
import { type User } from "../types";

async function createUser(username: string, email: string, password: string) {
  const sql = db.prepare(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
  );
  return sql.run(username, email, password);
}

async function getUserById(userId: number) {
  const sql = db.prepare("SELECT* FROM users WHERE id = ?");
  return sql.get(userId) as User;
}

async function getUserByEmail(email: string) {
  const sql = db.prepare("SELECT * FROM users WHERE email = ?");
  return sql.get(email) as User;
}

export { createUser, getUserById, getUserByEmail };
