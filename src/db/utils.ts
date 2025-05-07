import db from "./config";

async function initDB() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      isPublished BOOLEAN NOT NULL
    );
  `;

  try {
    db.exec(sql);
    console.log("Users and Posts tables ready (or already exist).");
  } catch (e) {
    console.error("Error initializing database:", e);
  }
}

export default initDB;
