import { useState } from "react";
import type { FormEvent } from "react";

const DEMO_LOGIN = {
  email: "trader@demo.dev",
  password: "demo1234"
};

interface LoginCardProps {
  error: string | null;
  isSubmitting: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
}

export const LoginCard = ({ error, isSubmitting, onLogin }: LoginCardProps) => {
  const [email, setEmail] = useState(DEMO_LOGIN.email);
  const [password, setPassword] = useState(DEMO_LOGIN.password);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onLogin(email, password);
    } catch {
      // Error state is surfaced by the auth hook.
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 md:px-8">
      <section className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <article className="relative overflow-hidden rounded-[36px] border border-slate-800/90 bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(3,7,18,0.99))] p-8 shadow-[0_28px_100px_rgba(0,0,0,0.46)] md:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)]" />
          <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_68%)] blur-2xl" />
          <p className="text-xs uppercase tracking-[0.32em] text-(--accent-muted)">
            Mocked Authentication
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Sign in through a cookie-backed demo session built for the dashboard.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
            The server owns the demo session, REST calls reuse the same cookie, and the live
            stream connects through the same authenticated context.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800/90 bg-slate-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Demo Email</p>
              <p className="mt-2 text-lg font-semibold text-white">{DEMO_LOGIN.email}</p>
            </div>
            <div className="rounded-3xl border border-slate-800/90 bg-slate-950/45 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Demo Password</p>
              <p className="mt-2 text-lg font-semibold text-white">{DEMO_LOGIN.password}</p>
            </div>
          </div>
        </article>

        <form
          onSubmit={handleSubmit}
          className="rounded-[36px] border border-slate-800/90 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(8,13,24,0.98))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur md:p-10"
        >
          <p className="text-xs uppercase tracking-[0.26em] text-(--accent-muted)">Sign In</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Access the dashboard</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Use the demo credentials below, or change them to test the invalid-session path.
          </p>

          <label className="mt-8 block text-sm font-medium text-slate-200" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/45 px-4 py-3 text-white outline-none ring-cyan-400/40 transition focus:ring-2"
            autoComplete="username"
          />

          <label className="mt-5 block text-sm font-medium text-slate-200" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/45 px-4 py-3 text-white outline-none ring-cyan-400/40 transition focus:ring-2"
            autoComplete="current-password"
          />

          {error ? (
            <p className="mt-5 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="hover:cursor-pointer flex-1 rounded-2xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing In..." : "Enter Dashboard"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO_LOGIN.email);
                setPassword(DEMO_LOGIN.password);
              }}
              className="hover:cursor-pointer rounded-2xl border border-slate-700/80 px-4 py-3 text-slate-200 transition hover:border-cyan-400/35 hover:bg-slate-900/80"
            >
              Auto Fill
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};
