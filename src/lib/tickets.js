import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase";

export const STATUS_OPTIONS = [
  { value: "checked-in", label: "Checked In", tone: "checked-in" },
  { value: "in-repair", label: "In Repair", tone: "repair" },
  { value: "waiting-parts", label: "Waiting on Parts", tone: "parts" },
  { value: "ready", label: "Ready", tone: "ready" },
  { value: "picked-up", label: "Picked Up", tone: "repair" }
];

export function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
}

export function createEmptyTicketForm() {
  return {
    ticketNumber: "",
    customerName: "",
    phone: "",
    email: "",
    status: "checked-in",
    password: "",
    device: "",
    issue: "",
    checkInDate: formatToday(),
    accessories: ""
  };
}

export function createTicketFormFromTicket(ticket) {
  return {
    ticketNumber: ticket?.ticketNumber || "",
    customerName: ticket?.customerName || "",
    phone: ticket?.phone || "",
    email: ticket?.email || "",
    status: ticket?.status || "checked-in",
    password: ticket?.password || "",
    device: ticket?.device || "",
    issue: ticket?.issue || "",
    checkInDate: ticket?.checkInDate || formatToday(),
    accessories: ticket?.accessories || ""
  };
}

export function getStatusOption(value) {
  return STATUS_OPTIONS.find((option) => option.value === value) || STATUS_OPTIONS[0];
}

export function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

export function sortTickets(tickets) {
  return [...tickets].sort((left, right) => {
    return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
  });
}

function normalizeTicketRow(row) {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email || "",
    status: row.status || "checked-in",
    password: row.password || "",
    device: row.device,
    issue: row.issue || "",
    checkInDate: row.check_in_date,
    accessories: row.accessories || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toTicketRow(ticket) {
  return {
    id: ticket.id,
    ticket_number: ticket.ticketNumber,
    customer_name: ticket.customerName,
    phone: ticket.phone,
    email: ticket.email || "",
    status: ticket.status || "checked-in",
    password: ticket.password || "",
    device: ticket.device,
    issue: ticket.issue || "",
    check_in_date: ticket.checkInDate,
    accessories: ticket.accessories || "",
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt
  };
}

export async function loadTickets() {
  if (!hasSupabaseConfig()) {
    return {
      data: [],
      error: new Error("Supabase environment variables are missing.")
    };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return {
        data: [],
        error
      };
    }

    return {
      data: Array.isArray(data) ? data.map(normalizeTicketRow) : [],
      error: null
    };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Unable to load tickets.")
    };
  }
}

export async function saveTicket(ticket) {
  if (!hasSupabaseConfig()) {
    return {
      data: null,
      error: new Error("Supabase environment variables are missing.")
    };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("tickets")
      .upsert(toTicketRow(ticket), { onConflict: "id" })
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error
      };
    }

    return {
      data: data ? normalizeTicketRow(data) : ticket,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unable to save ticket.")
    };
  }
}

export async function removeTicket(ticketId) {
  if (!hasSupabaseConfig()) {
    return {
      error: new Error("Supabase environment variables are missing.")
    };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("tickets").delete().eq("id", ticketId);

    return {
      error: error || null
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error("Unable to delete ticket.")
    };
  }
}

export function nextTicketNumber(tickets) {
  const highestNumber = tickets.reduce((maxValue, ticket) => {
    const numericPart = Number.parseInt(String(ticket.ticketNumber || "").replace(/\D/g, ""), 10);
    return Number.isFinite(numericPart) ? Math.max(maxValue, numericPart) : maxValue;
  }, 1041);

  return `RPR-${String(highestNumber + 1).padStart(4, "0")}`;
}

export function calculateTicketStats(tickets) {
  const today = formatToday();

  return [
    {
      label: "Checked in today",
      value: String(tickets.filter((ticket) => ticket.checkInDate === today).length)
    },
    {
      label: "In repair",
      value: String(tickets.filter((ticket) => ticket.status === "in-repair").length)
    },
    {
      label: "Ready",
      value: String(tickets.filter((ticket) => ticket.status === "ready").length)
    },
    {
      label: "Open tickets",
      value: String(tickets.filter((ticket) => ticket.status !== "picked-up").length)
    }
  ];
}

export function isFinishedTicket(ticket, now = Date.now()) {
  if (!ticket || ticket.status !== "picked-up") {
    return false;
  }

  const completedAt = new Date(ticket.updatedAt || ticket.createdAt || 0).getTime();

  if (!Number.isFinite(completedAt) || completedAt <= 0) {
    return false;
  }

  return now - completedAt >= 24 * 60 * 60 * 1000;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function printTicketLabel(ticket) {
  if (typeof window === "undefined" || !ticket) {
    return {
      ok: false,
      reason: "Nothing to print."
    };
  }

  const printWindow = window.open("", "_blank", "width=420,height=320");

  if (!printWindow) {
    return {
      ok: false,
      reason: "Allow popups to print the sticker."
    };
  }

  const passwordMarkup = ticket.password ? `<p>${escapeHtml(`PW: ${ticket.password}`)}</p>` : "";

  const markup = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(ticket.ticketNumber)} label</title>
    <style>
      @page {
        size: 3.5in 1.125in;
        margin: 0;
      }

      html,
      body {
        width: 3.5in;
        height: 1.125in;
        margin: 0;
        overflow: hidden;
        font-family: Arial, sans-serif;
        color: #111827;
        background: #ffffff;
      }

      .label {
        width: 3.5in;
        height: 1.125in;
        padding: 0.08in 0.11in;
        border: 1px solid #111827;
        border-radius: 0;
        display: grid;
        gap: 0.02in;
        box-sizing: border-box;
      }

      .topline {
        display: flex;
        justify-content: space-between;
        gap: 0.08in;
        font-size: 8px;
        font-weight: 700;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-size: 13px;
        line-height: 1.1;
      }

      p {
        margin: 0;
        font-size: 8px;
        line-height: 1.1;
        color: #4b5563;
      }

      .issue {
        padding-top: 0.02in;
        border-top: 1px solid #e5e7eb;
      }
    </style>
  </head>
  <body>
    <div class="label">
      <div class="topline">
        <span>#${escapeHtml(ticket.ticketNumber)}</span>
        <span>${escapeHtml(ticket.checkInDate)}</span>
      </div>
      <h1>${escapeHtml(ticket.customerName)}</h1>
      <p>${escapeHtml(ticket.device)}</p>
      <p>${escapeHtml(ticket.phone)}</p>
      ${passwordMarkup}
      <p class="issue">${escapeHtml(ticket.issue || "No issue note")}</p>
      <p>${escapeHtml(ticket.accessories || "No accessories")}</p>
    </div>
    <script>
      window.addEventListener("load", () => {
        window.print();
        window.setTimeout(() => window.close(), 200);
      });
    </script>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(markup);
  printWindow.document.close();

  return {
    ok: true
  };
}
