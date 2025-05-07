import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import initDB from "./db/utils";
import userRoutes from "./routes/users";
import postRoutes from "./routes/posts";
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

initDB();

app.use(express.json());

app.use(
  session({
    secret: "Paula blog",
    cookie: { maxAge: 1800000 },
    saveUninitialized: false,
    resave: false,
  })
);

app.get("/index.html", isAuthenticated, (req, res) => {
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
      req.path === "/" ? "login.html" : req.path
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

app.use("/users", userRoutes);

app.use("/posts", postRoutes);

// Serve static files from the public/assets directory
app.use("/assets", express.static(path.join(__dirname, "../public/assets")));

//Handle 404 errors for non-existing files
app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
