import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import initDB from "./db/utils";
import db from "./db/config";
import seedUsersTable from "./db/utils/seedUsers";
import userRoutes from "./routes/users";
import postRoutes from "./routes/posts";
import likeRoutes from "./routes/likes";
import commentRoutes from "./routes/comments";
import { isAuthenticated } from "./middleware/auth";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      email: string;
    };
  }
}

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  initDB();

  try {
    console.log("Checking if user seeding is required...");
    const query = db.query("SELECT COUNT(*) as count FROM users;");
    const result = query.get() as { count: number } | null;

    if (result && result.count === 0) {
      console.log("Users table is empty. Proceeding with seeding");
      await seedUsersTable();
    } else if (result) {
      console.log(
        `Users table already contains ${result.count} records. Skipping seeding`
      );
    } else {
      console.error(
        "Could not determine user count from users table. Skipping seeding"
      );
    }
  } catch (error) {
    console.error("Error during user count check or seeding:", error);
  }

  app.use(express.json());

  app.use(
    session({
      secret: "webprojectblog",
      cookie: { maxAge: 1800000 }, // 30 minutes
      saveUninitialized: false,
      resave: false,
    })
  );

  app.get("/index.html", (req, res) => {
    console.log(
      `Serving index.html to logged-in user: ${req.session.user?.username}`
    );
    res.sendFile(path.join(__dirname, "pages", "index.html"));
  });

  app.get("/dashboard.html", isAuthenticated, (req, res) => {
    console.log(
      `Serving dashboard.html to logged-in user: ${req.session.user?.username}`
    );
    res.sendFile(path.join(__dirname, "pages", "dashboard.html"));
  });

  const transpiler = new Bun.Transpiler({ loader: "ts" });

  app.use((req, res, next) => {
    (async () => {
      const filePath = path.join(
        __dirname,
        "pages",
        req.path === "/" ? "index.html" : req.path
      );
      const file = Bun.file(filePath);

      if (await file.exists()) {
        if (filePath.endsWith(".ts")) {
          const text = await file.text();
          const js = transpiler.transformSync(text);
          res.setHeader("Content-Type", "text/javascript");
          return res.send(js);
        }
        return res.sendFile(filePath);
      }
      next();
    })().catch(next);
  });

  // API Routes
  app.use("/users", userRoutes);
  app.use("/posts", postRoutes);
  app.use("/likes", likeRoutes);
  app.use("/comments", commentRoutes);

  app.use(express.static(path.join(__dirname, "../public")));
  app.use("/assets", express.static(path.join(__dirname, "../public/assets")));

  app.use((req, res) => {
    res.status(404).send("Not Found");
  });

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error("Failed to start the application:", error);
  process.exit(1);
});
