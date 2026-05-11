import { randomUUID } from "crypto";
import { AuthSession, AuthUser } from "../types";

interface DemoUserRecord extends AuthUser {
  password: string;
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const DEMO_USERS: DemoUserRecord[] = [
  {
    id: "user-demo-trader",
    name: "Demo Trader",
    email: "trader@demo.dev",
    role: "trader",
    password: "demo1234"
  },
  {
    id: "user-demo-analyst",
    name: "Market Analyst",
    email: "analyst@demo.dev",
    role: "analyst",
    password: "marketwatch"
  }
];

const toPublicUser = ({ password: _password, ...user }: DemoUserRecord): AuthUser => user;

export class AuthService {
  private readonly sessions = new Map<string, AuthSession>();

  getSessionTtlMs(): number {
    return SESSION_TTL_MS;
  }

  login(email: string, password: string): AuthSession | null {
    const normalizedEmail = email.trim().toLowerCase();
    const matchingUser = DEMO_USERS.find(
      (user) => user.email.toLowerCase() === normalizedEmail && user.password === password
    );

    if (!matchingUser) {
      return null;
    }

    const session: AuthSession = {
      token: randomUUID(),
      user: toPublicUser(matchingUser),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
    };

    this.sessions.set(session.token, session);
    return session;
  }

  validateToken(token: string): AuthSession | null {
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  refreshSession(token: string): AuthSession | null {
    const session = this.validateToken(token);
    if (!session) {
      return null;
    }

    const refreshedSession: AuthSession = {
      ...session,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
    };

    this.sessions.set(token, refreshedSession);
    return refreshedSession;
  }

  logout(token: string): boolean {
    return this.sessions.delete(token);
  }
}
