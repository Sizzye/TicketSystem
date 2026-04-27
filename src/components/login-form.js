"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        setError(result?.message || "Login failed.");
        setIsSubmitting(false);
        return;
      }

      const nextPath = searchParams.get("next") || "/tickets";
      router.replace(nextPath);
      router.refresh();
    } catch (_error) {
      setError("Login failed.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="login-field">
        <span>Username</span>
        <input value={username} onChange={(event) => setUsername(event.target.value)} />
      </div>

      <div className="login-field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? <p className="login-error">{error}</p> : null}

      <button type="submit" className="button-primary login-submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
