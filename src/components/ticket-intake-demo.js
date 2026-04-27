"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { printTicketWithDymo } from "@/lib/dymo";
import {
  createEmptyTicketForm,
  loadTickets,
  nextTicketNumber,
  printTicketLabel,
  saveTicket
} from "@/lib/tickets";

export default function TicketIntakeDemo() {
  const router = useRouter();
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    password: "",
    device: "",
    issue: "",
    checkInDate: "",
    accessories: ""
  });
  const [ticketId, setTicketId] = useState(null);
  const [ticketNumber, setTicketNumber] = useState("RPR-....");
  const [savedTicket, setSavedTicket] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    async function prepareForm() {
      const { data, error } = await loadTickets();
      setForm(createEmptyTicketForm());
      setTicketNumber(nextTicketNumber(data));

      if (error) {
        setNotice({
          title: "Supabase setup needed",
          message:
            "Run the tickets setup SQL in Supabase before saving live tickets. The SQL file is included in this project."
        });
      }
    }

    prepareForm();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSaveTicket() {
    if (!form.customerName.trim() || !form.phone.trim() || !form.device.trim()) {
      setNotice({
        title: "Missing information",
        message: "Enter customer name, phone number, and device."
      });
      return;
    }

    const currentTimestamp = new Date().toISOString();
    const nextId = ticketId || crypto.randomUUID();
    const ticketRecord = {
      id: nextId,
      ticketNumber,
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      device: form.device.trim(),
      issue: form.issue.trim(),
      accessories: form.accessories.trim(),
      checkInDate: form.checkInDate.trim(),
      status: "checked-in",
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp
    };

    const { data, error } = await saveTicket(ticketRecord);

    if (error) {
      setNotice({
        title: "Unable to save ticket",
        message: error.message || "Supabase is not ready yet."
      });
      return;
    }

    setTicketId(nextId);
    setSavedTicket(data || ticketRecord);
  }

  async function startNewTicket() {
    const { data } = await loadTickets();
    setForm(createEmptyTicketForm());
    setTicketId(null);
    setTicketNumber(nextTicketNumber(data));
    setSavedTicket(null);
  }

  function handleBrowserPrintSavedTicket() {
    const printTarget = savedTicket;

    setSavedTicket(null);
    window.setTimeout(() => {
      const result = printTicketLabel(printTarget);

      if (!result.ok) {
        setNotice({
          title: "Printing blocked",
          message: result.reason || "The sticker could not be opened for printing."
        });
      }

      router.push("/tickets");
    }, 80);
  }

  function handleDymoPrintSavedTicket() {
    if (!savedTicket) {
      return;
    }

    const result = printTicketWithDymo(savedTicket);

    if (!result.ok) {
      setNotice({
        title: "DYMO print failed",
        message: result.reason || "The DYMO printer did not respond."
      });
      return;
    }

    setSavedTicket(null);
    router.push("/tickets");
  }

  function handleSkipPrint() {
    setSavedTicket(null);
    router.push("/tickets");
  }

  return (
    <section className="intake-layout">
      <form className="form-card form-card-rich no-print" onSubmit={(event) => event.preventDefault()}>
        <div className="form-card-head">
          <div>
            <p className="section-label">Intake form</p>
            <h2>{ticketNumber}</h2>
          </div>
          <div className="hero-actions hero-actions-wide">
            <button type="button" className="button-secondary" onClick={startNewTicket}>
              New blank
            </button>
            <button type="button" className="button-primary" onClick={handleSaveTicket}>
              Create ticket
            </button>
          </div>
        </div>

        <div className="form-grid">
          <label className="field-block">
            <span>Customer name</span>
            <input name="customerName" value={form.customerName} onChange={updateField} />
          </label>

          <label className="field-block">
            <span>Check-in date</span>
            <input name="checkInDate" value={form.checkInDate} onChange={updateField} />
          </label>

          <label className="field-block">
            <span>Phone number</span>
            <input name="phone" value={form.phone} onChange={updateField} />
          </label>

          <label className="field-block">
            <span>Email</span>
            <input name="email" value={form.email} onChange={updateField} />
          </label>

          <label className="field-block">
            <span>Password</span>
            <input name="password" value={form.password} onChange={updateField} />
          </label>

          <label className="field-block field-block-wide">
            <span>Device</span>
            <input name="device" value={form.device} onChange={updateField} />
          </label>

          <label className="field-block field-block-wide">
            <span>Problem description</span>
            <textarea name="issue" rows="4" value={form.issue} onChange={updateField} />
          </label>

          <label className="field-block field-block-wide">
            <span>Accessories left with device</span>
            <input name="accessories" value={form.accessories} onChange={updateField} />
          </label>
        </div>
      </form>

      <aside className="preview-column">
        <article className="preview-card preview-card-rich">
          <div className="preview-card-head">
            <div>
              <p className="section-label">Sticker preview</p>
              <h2>Device label</h2>
            </div>
            <span className="preview-chip">DYMO-ready</span>
          </div>
          <div className="sticker-sheet">
            <div className="sticker-card sticker-card-compact">
              <div className="sticker-main">
                <div className="sticker-topline">
                  <span className="sticker-ticket">#{ticketNumber}</span>
                  <span className="sticker-date">{form.checkInDate || "Date"}</span>
                </div>
                <h3>{form.customerName || "Customer name"}</h3>
                <p className="sticker-device-line">{form.device || "Device"}</p>
                <p className="sticker-phone-line">{form.phone || "Phone"}</p>
                {form.password ? <p className="sticker-password-line">PW: {form.password}</p> : null}
                <p className="sticker-issue-line">{form.issue || "Issue note"}</p>
                <p className="sticker-accessories-line">{form.accessories || "Accessories"}</p>
              </div>
            </div>
          </div>
        </article>
      </aside>

      <section className="print-only-label" aria-hidden="true">
        <div className="sticker-card-print-wrap">
          <div className="sticker-card sticker-card-compact sticker-card-print">
            <div className="sticker-main">
              <div className="sticker-topline">
                <span className="sticker-ticket">#{ticketNumber}</span>
                <span className="sticker-date">{form.checkInDate || "Date"}</span>
              </div>
              <h3>{form.customerName || "Customer name"}</h3>
              <p className="sticker-device-line">{form.device || "Device"}</p>
              <p className="sticker-phone-line">{form.phone || "Phone"}</p>
              {form.password ? <p className="sticker-password-line">PW: {form.password}</p> : null}
              <p className="sticker-issue-line">{form.issue || "Issue note"}</p>
              <p className="sticker-accessories-line">{form.accessories || "Accessories"}</p>
            </div>
          </div>
        </div>
      </section>

      {savedTicket ? (
        <div className="modal-backdrop" onClick={handleSkipPrint}>
          <div className="modal-card modal-card-rich" onClick={(event) => event.stopPropagation()}>
            <p className="section-label">Ticket saved</p>
            <h2>Print sticker now?</h2>
            <p className="modal-copy">
              {savedTicket.ticketNumber} for {savedTicket.customerName}
            </p>
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={handleSkipPrint}>
                Not now
              </button>
              <button type="button" className="button-secondary" onClick={handleDymoPrintSavedTicket}>
                Print with DYMO
              </button>
              <button type="button" className="button-primary" onClick={handleBrowserPrintSavedTicket}>
                Browser print
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="modal-backdrop" onClick={() => setNotice(null)}>
          <div className="modal-card modal-card-rich" onClick={(event) => event.stopPropagation()}>
            <p className="section-label">Notice</p>
            <h2>{notice.title}</h2>
            <p className="modal-copy">{notice.message}</p>
            <div className="modal-actions">
              <button type="button" className="button-primary" onClick={() => setNotice(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
