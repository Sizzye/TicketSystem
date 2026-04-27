import TicketDashboard from "@/components/ticket-dashboard";

export const metadata = {
  title: "Tickets | Repair Desk Web"
};

export default function TicketsPage() {
  return (
    <main className="app-shell">
      <TicketDashboard heading="Repair tickets" eyebrow="Ticket board" />
    </main>
  );
}
