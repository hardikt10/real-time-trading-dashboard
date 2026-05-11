import { Request, Response, Router } from "express";
import { createAuthMiddleware } from "../middleware/auth";
import { AuthSession } from "../types";
import { AuthService } from "../services/auth-service";
import {
  clearSessionCookie,
  createSessionCookie,
  getSessionTokenFromRequest
} from "../utils/auth";

interface LoginRequestBody {
  email?: unknown;
  password?: unknown;
}

export const createAuthRouter = (authService: AuthService): Router => {
  const router = Router();
  const requireAuth = createAuthMiddleware(authService);

  router.post("/login", (req: Request, res: Response) => {
    const body = req.body as LoginRequestBody;
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    const session = authService.login(email, password);
    if (!session) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    res.setHeader("Set-Cookie", createSessionCookie(session.token, authService.getSessionTtlMs()));
    res.json({
      expiresAt: session.expiresAt,
      user: session.user
    });
  });

  router.get("/me", requireAuth, (_req: Request, res: Response) => {
    const session = res.locals.auth as AuthSession;
    res.json({
      expiresAt: session.expiresAt,
      user: session.user
    });
  });

  router.post("/logout", (req: Request, res: Response) => {
    const session = res.locals.auth as AuthSession | undefined;
    const token =
      session?.token ??
      getSessionTokenFromRequest({
        headers: {
          authorization: req.header("authorization"),
          cookie: req.header("cookie")
        }
      });

    if (token) {
      authService.logout(token);
    }

    res.setHeader("Set-Cookie", clearSessionCookie());
    res.status(204).send();
  });

  return router;
};
