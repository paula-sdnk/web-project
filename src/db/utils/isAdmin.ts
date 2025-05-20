import { Router, type Request, type Response } from "express";
import db from "../config.ts";

export async function isAdmin(req: Request) {
  const userId = req.session.user?.id;
  if (!userId) {
    return false;
  }

  try {
    const sql = await db.prepare("SELECT isAdmin FROM users WHERE id = ?");
    const user = (await sql.get(userId)) as null | { isAdmin: number };
    if (!user) return false;

    return user?.isAdmin === 1;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
