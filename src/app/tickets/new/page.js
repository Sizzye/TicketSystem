import Link from "next/link";
import TicketIntakeDemo from "@/components/ticket-intake-demo";

export const metadata = {
  title: "New Ticket | Repair Desk Web"
};

export default function NewTicketPage() {
  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Check-in screen</p>
          <h1>Create a repair ticket</h1>
        </div>

        <div className="hero-actions">
          <Link href="/tickets" className="button-secondary">
            View tickets
          </Link>
          <Link href="/" className="button-secondary">
            Home
          </Link>
        </div>
      </section>

      <TicketIntakeDemo />
    </main>
  );
}
