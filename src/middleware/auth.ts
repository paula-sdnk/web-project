import { type Request, type Response, type NextFunction } from "express";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session && req.session.user && req.session.user.id) {
    return next();
  }
  res.redirect("/login.html");
};
