import { describe, expect, it } from "vitest";
import { AuthService } from "../src/services/auth-service";

describe("AuthService", () => {
  it("creates a session for valid demo credentials", () => {
    const authService = new AuthService();
    const session = authService.login("trader@demo.dev", "demo1234");

    expect(session).not.toBeNull();
    expect(session?.user.email).toBe("trader@demo.dev");
    expect(session?.token).toBeTruthy();
  });

  it("rejects invalid credentials", () => {
    const authService = new AuthService();
    const session = authService.login("trader@demo.dev", "wrong-password");

    expect(session).toBeNull();
  });

  it("invalidates sessions on logout", () => {
    const authService = new AuthService();
    const session = authService.login("analyst@demo.dev", "marketwatch");
    expect(session).not.toBeNull();

    authService.logout(session!.token);

    expect(authService.validateToken(session!.token)).toBeNull();
  });
});
