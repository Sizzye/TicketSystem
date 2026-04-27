import TicketDashboard from "@/components/ticket-dashboard";

export default function HomePage() {
  return (
    <main className="app-shell">
      <TicketDashboard heading="Front desk" eyebrow="Repair Desk" />
    </main>
  );
}
