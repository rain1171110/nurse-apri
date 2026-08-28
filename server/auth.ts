import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({
        error: "Authentication required / 認証が必要です",
      });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string" || typeof decoded.userId !== "string") {
      res.status(401).json({
        error: "Invalid token payload / トークン内容が無効です",
      });
      return;
    }
    const userId = decoded.userId;
    req.userId = userId
    next();
  } catch (error) {
    res.status(401).json({
      error: "Invalid or expired token / トークンが無効または期限切れです",
    });
    return;
  }
};
