import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { createUser, getUserByEmail, getUserById } from "../db/handlers/users";
import { tryCatch } from "../lib/lib";

const router: Router = Router();

router.post("/register", async (req: Request, res: Response) => {
  console.log(req.body);
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: "All fields are required!" });
    return;
  }

  if ((password || "").length < 8) {
    res
      .status(400)
      .json({ message: "Password must be at least 8 characters." });
    return;
  }

  const { data: hashedPassword, error: hashingError } = await tryCatch(
    bcrypt.hash(password, 10)
  );

  if (hashingError) {
    res.status(500).json({ message: "Error while hashing password" });
    return;
  }

  const { data: userId, error: sqliteError } = await tryCatch(
    createUser(username, email, hashedPassword)
  );

  if (sqliteError) {
    console.log(sqliteError);
    res.status(500).json({
      message: "Email is a duplicate",
    });
    return;
  }

  res
    .status(200)
    .send({ message: `User added successfully with id = ${userId}` });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { data: user, error: userError } = await tryCatch(
    getUserByEmail(email)
  );

  if (userError) {
    console.error("Database error fetching user for email:", email, userError);
    res.status(500).send({ message: "Server error. Please try again later." });
    return;
  }

  if (!user) {
    console.log("Login attempt: User not found with email:", email);
    res.status(401).send({ message: "Invalid credentials" });
    return;
  }

  const { data: isMatch, error: compareError } = await tryCatch(
    bcrypt.compare(password, user.password)
  );

  if (compareError) {
    console.error(
      "Error during the password comparison process:",
      compareError
    );
    res
      .status(500)
      .send({ message: "Server error during authentication process." });
    return;
  }

  if (!isMatch) {
    console.log("Password mismatch for user:", email);
    res.status(401).send({ message: "Incorrect password." });
    return;
  }

  if (isMatch) {
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        res
          .status(500)
          .send({ message: "Login failed. Could not regenerate session." });
        return;
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };
      res
        .status(200)
        .send({ message: "Login successful!", user: req.session.user });
    });

    return;
  }
  res.status(400).send("Invalid credentials");
});

export default router;
