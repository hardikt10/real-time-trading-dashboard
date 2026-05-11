import { NextFunction, Request, Response } from "express";
import { AuthSession } from "../types";
import { AuthService } from "../services/auth-service";
import { createSessionCookie, getSessionTokenFromRequest } from "../utils/auth";

export const createAuthMiddleware =
  (authService: AuthService) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const token = getSessionTokenFromRequest({
      headers: {
        authorization: req.header("authorization"),
        cookie: req.header("cookie")
      }
    });

    if (!token) {
      res.status(401).json({ error: "Missing authenticated session." });
      return;
    }

    const session = authService.refreshSession(token);
    if (!session) {
      res.status(401).json({ error: "Invalid or expired session." });
      return;
    }

    res.setHeader("Set-Cookie", createSessionCookie(session.token, authService.getSessionTtlMs()));
    res.locals.auth = session satisfies AuthSession;
    next();
  };
