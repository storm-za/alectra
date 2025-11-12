import bcrypt from "bcrypt";
import type { Request, Response, NextFunction } from "express";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any).userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any).userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const session = req.session as any;
  if (!session.userRole || session.userRole !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
