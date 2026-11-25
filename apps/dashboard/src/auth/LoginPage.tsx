
import { useState, type FormEvent } from "react";
import { LockKeyhole, Music2, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-screen">
      <div className="login-background-glow" />

      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Music2 size={25} />
          </div>
          <div>
            <h1>VerseServer</h1>
            <span>ADMIN CONSOLE</span>
          </div>
        </div>

        <div className="login-heading">
          <div className="login-lock-icon">
            <LockKeyhole size={21} />
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to manage your VerseServer infrastructure.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="admin-email">Email address</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            placeholder="admin@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={254}
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            maxLength={128}
          />

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in to dashboard"}
          </button>
        </form>

        <div className="login-security">
          <ShieldCheck size={16} />
          <span>Secure administrator access</span>
        </div>
      </section>

      <footer className="login-footer">
        VerseServer · Infrastructure for VerseHana
      </footer>
    </main>
  );
}
