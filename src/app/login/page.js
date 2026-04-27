import LoginForm from "@/components/login-form";

export const metadata = {
  title: "Login | Repair Desk Web"
};

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-copy">
          <p className="eyebrow">Repair Desk</p>
          <h1>Sign in</h1>
          <p className="login-subtitle">Use your shop login to open tickets and print labels.</p>
        </div>

        <LoginForm />

        <div className="login-help">
          <p className="section-label">Credentials</p>
          <div className="login-help-row login-help-note">
            <strong>Shop logins are active.</strong>
            <span>Change them in `.env.local` before going live.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
