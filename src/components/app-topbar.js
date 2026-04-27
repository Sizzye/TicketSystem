"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppTopbar({ session }) {
  const pathname = usePathname();

  if (pathname === "/login" || !session) {
    return null;
  }

  return (
    <header className="topbar no-print">
      <div className="topbar-brand">
        <div className="brand-badge">RD</div>
        <div>
          <p className="topbar-label">Repair Desk</p>
          <strong>Service Console</strong>
        </div>
      </div>

      <div className="topbar-actions">
        <nav className="topbar-nav">
          <Link href="/tickets/new" className="topbar-link topbar-link-strong">
            New ticket
          </Link>
        </nav>

        <div className="user-pill">
          <div>
            <p className="user-pill-label">{session.displayName}</p>
            <span className="user-pill-role">{session.role}</span>
          </div>

          <form action="/api/auth/logout" method="post">
            <button type="submit" className="button-secondary topbar-logout">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
