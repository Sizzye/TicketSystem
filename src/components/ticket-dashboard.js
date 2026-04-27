"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { printTicketWithDymo } from "@/lib/dymo";
import {
  STATUS_OPTIONS,
  calculateTicketStats,
  createEmptyTicketForm,
  createTicketFormFromTicket,
  getStatusOption,
  isFinishedTicket,
  loadStoredTickets,
  normalizePhone,
  printTicketLabel,
  persistTickets,
  sortTickets
} from "@/lib/tickets";

export default function TicketDashboard({ heading, eyebrow }) {
  const [tickets, setTickets] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [activeView, setActiveView] = useState("open");
  const [openMenu, setOpenMenu] = useState(null);
  const [openStatusMenu, setOpenStatusMenu] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [editForm, setEditForm] = useState(() => createEmptyTicketForm());
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    function syncTickets() {
      setTickets(loadStoredTickets());
    }

    syncTickets();
    window.addEventListener("tickets:changed", syncTickets);
    window.addEventListener("storage", syncTickets);

    return () => {
      window.removeEventListener("tickets:changed", syncTickets);
      window.removeEventListener("storage", syncTickets);
    };
  }, []);

  useEffect(() => {
    function handleDocumentClick(event) {
      const target = event.target;

      if (
        target instanceof Element &&
        target.closest(
          ".row-menu-wrap, .row-menu-floating, .status-trigger-wrap, .status-menu-floating"
        )
      ) {
        return;
      }

      setOpenMenu(null);
      setOpenStatusMenu(null);
    }

    function handleViewportChange() {
      setOpenMenu(null);
      setOpenStatusMenu(null);
    }

    function handleEscape(event) {
      if (event.key !== "Escape") {
        return;
      }

      setOpenMenu(null);
      setOpenStatusMenu(null);
      setDeleteTargetId(null);
      setEditTargetId(null);
      setNotice(null);
    }

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, []);

  const now = Date.now();
  const openTickets = tickets.filter((ticket) => !isFinishedTicket(ticket, now));
  const finishedTickets = tickets.filter((ticket) => isFinishedTicket(ticket, now));
  const sourceTickets = activeView === "finished" ? finishedTickets : openTickets;
  const stats = calculateTicketStats(openTickets);

  const filteredTickets = sourceTickets.filter((ticket) => {
    const search = searchValue.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return (
      ticket.ticketNumber.toLowerCase().includes(search) ||
      ticket.customerName.toLowerCase().includes(search) ||
      normalizePhone(ticket.phone).includes(normalizePhone(search))
    );
  });

  const openStatusTicket = tickets.find((ticket) => ticket.id === openStatusMenu?.id) || null;

  function updateStoredTickets(nextTickets) {
    const sortedTickets = sortTickets(nextTickets);
    persistTickets(sortedTickets);
    setTickets(sortedTickets);
  }

  function handleStatusChange(ticketId, nextStatus) {
    const nextTickets = tickets.map((ticket) => {
      if (ticket.id !== ticketId) {
        return ticket;
      }

      return {
        ...ticket,
        status: nextStatus,
        updatedAt: new Date().toISOString()
      };
    });

    updateStoredTickets(nextTickets);
    setOpenStatusMenu(null);
  }

  function handleDelete(ticketId) {
    if (!ticketId) {
      return;
    }

    const nextTickets = tickets.filter((entry) => entry.id !== ticketId);
    updateStoredTickets(nextTickets);
    setOpenMenu(null);
    setDeleteTargetId(null);
  }

  async function handleReprint(ticket) {
    if (!ticket) {
      setNotice({
        title: "Unable to reprint",
        message: "This ticket could not be found."
      });
      setOpenMenu(null);
      return;
    }

    const result = printTicketWithDymo(ticket);

    if (!result.ok) {
      const fallback = await printTicketLabel(ticket);

      if (!fallback.ok) {
        setNotice({
          title: "Printing blocked",
          message: fallback.reason || "The sticker could not be opened for printing."
        });
      }
    }

    setOpenMenu(null);
  }

  function handleEditOpen(ticketId) {
    const ticket = tickets.find((entry) => entry.id === ticketId);

    if (!ticket) {
      setNotice({
        title: "Unable to edit",
        message: "This ticket could not be found."
      });
      return;
    }

    setEditForm(createTicketFormFromTicket(ticket));
    setEditTargetId(ticketId);
    setOpenMenu(null);
  }

  function updateEditField(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  }

  function handleEditSave() {
    if (
      !editForm.ticketNumber.trim() ||
      !editForm.customerName.trim() ||
      !editForm.phone.trim() ||
      !editForm.device.trim()
    ) {
      setNotice({
        title: "Missing information",
        message: "Ticket number, customer name, phone number, and device are required."
      });
      return;
    }

    const nextTickets = tickets.map((ticket) => {
      if (ticket.id !== editTargetId) {
        return ticket;
      }

      return {
        ...ticket,
        ticketNumber: editForm.ticketNumber.trim(),
        customerName: editForm.customerName.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        status: editForm.status,
        password: editForm.password.trim(),
        device: editForm.device.trim(),
        issue: editForm.issue.trim(),
        checkInDate: editForm.checkInDate.trim(),
        accessories: editForm.accessories.trim(),
        updatedAt: new Date().toISOString()
      };
    });

    updateStoredTickets(nextTickets);
    setEditTargetId(null);
  }

  function toggleMenu(ticketId, event) {
    const rect = event.currentTarget.getBoundingClientRect();

    setOpenMenu((current) => {
      if (current?.id === ticketId) {
        return null;
      }

      return {
        id: ticketId,
        top: rect.bottom + 8,
        left: Math.max(12, rect.right - 180)
      };
    });
  }

  function toggleStatusMenu(ticketId, event) {
    const rect = event.currentTarget.getBoundingClientRect();

    setOpenStatusMenu((current) => {
      if (current?.id === ticketId) {
        return null;
      }

      return {
        id: ticketId,
        top: rect.bottom + 8,
        left: Math.max(12, rect.left),
        width: Math.max(190, rect.width)
      };
    });
  }

  return (
    <>
      <section className="page-header page-header-home hero-surface">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{heading}</h1>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((item) => (
          <article key={item.label} className="stat-card stat-card-rich">
            <span className="stat-value">{item.value}</span>
            <span className="stat-label">{item.label}</span>
          </article>
        ))}
      </section>

      <section className="table-card queue-card">
        <div className="table-toolbar table-toolbar-stack">
          <div>
            <p className="table-caption">
              {activeView === "finished" ? "Finished tickets" : "Open tickets"}
            </p>
            <p className="table-hint">
              {filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="toolbar-controls toolbar-controls-wide">
            <div className="segment-control">
              <button
                type="button"
                className={`segment-button${activeView === "open" ? " is-active" : ""}`}
                onClick={() => setActiveView("open")}
              >
                Open tickets
                <span className="segment-count">{openTickets.length}</span>
              </button>
              <button
                type="button"
                className={`segment-button${activeView === "finished" ? " is-active" : ""}`}
                onClick={() => setActiveView("finished")}
              >
                Finished tickets
                <span className="segment-count">{finishedTickets.length}</span>
              </button>
            </div>

            <input
              className="search-input"
              type="search"
              placeholder="Search name or phone"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
        </div>

        {filteredTickets.length ? (
          <div className="ticket-table-wrap">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Customer</th>
                  <th>Device</th>
                  <th>Password</th>
                  <th>Issue</th>
                  <th>Accessories</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const status = getStatusOption(ticket.status);

                  return (
                    <tr key={ticket.id}>
                      <td>
                        <strong>{ticket.ticketNumber}</strong>
                        <span className="row-note">{ticket.checkInDate}</span>
                      </td>
                      <td>
                        <strong>{ticket.customerName}</strong>
                        <span className="row-note">{ticket.phone}</span>
                      </td>
                      <td>
                        <strong>{ticket.device}</strong>
                        <span className="row-note">{ticket.email || "No email"}</span>
                      </td>
                      <td>
                        <span className="password-pill">{ticket.password || "None"}</span>
                      </td>
                      <td>{ticket.issue || "No issue note"}</td>
                      <td>{ticket.accessories || "No accessories"}</td>
                      <td>
                        <div className="status-cell">
                          <span className={`status-badge status-${status.tone}`}>{status.label}</span>
                          <div className="status-trigger-wrap">
                            <button
                              type="button"
                              className="status-select-trigger"
                              aria-haspopup="menu"
                              aria-expanded={openStatusMenu?.id === ticket.id ? "true" : "false"}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleStatusMenu(ticket.id, event);
                              }}
                            >
                              <span>{status.label}</span>
                              <span className="status-select-chevron">v</span>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="row-menu-wrap" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className="row-menu-button"
                            aria-label={`Open actions for ${ticket.ticketNumber}`}
                            aria-expanded={openMenu?.id === ticket.id ? "true" : "false"}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleMenu(ticket.id, event);
                            }}
                          >
                            <span></span>
                            <span></span>
                            <span></span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-card">
            <h3>{activeView === "finished" ? "No finished tickets yet" : "No open tickets"}</h3>
            <p>
              {activeView === "finished"
                ? "Picked up tickets move here after one day."
                : "Create the first ticket to start the queue."}
            </p>
          </div>
        )}
      </section>

      {openMenu
        ? createPortal(
            <div
              className="row-menu row-menu-floating"
              style={{
                top: `${openMenu.top}px`,
                left: `${openMenu.left}px`
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="row-menu-item"
                onClick={() => handleEditOpen(openMenu.id)}
              >
                Edit ticket
              </button>
              <button
                type="button"
                className="row-menu-item"
                onClick={() => handleReprint(tickets.find((ticket) => ticket.id === openMenu.id))}
              >
                Reprint sticker
              </button>
              <button
                type="button"
                className="row-menu-item row-menu-item-danger"
                onClick={() => {
                  setDeleteTargetId(openMenu.id);
                  setOpenMenu(null);
                }}
              >
                Delete ticket
              </button>
            </div>,
            document.body
          )
        : null}

      {openStatusMenu && openStatusTicket
        ? createPortal(
            <div
              className="status-menu status-menu-floating"
              style={{
                top: `${openStatusMenu.top}px`,
                left: `${openStatusMenu.left}px`,
                width: `${openStatusMenu.width}px`
              }}
              onClick={(event) => event.stopPropagation()}
            >
              {STATUS_OPTIONS.map((option) => {
                const isActive = option.value === openStatusTicket.status;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`status-menu-item${isActive ? " is-active" : ""}`}
                    onClick={() => handleStatusChange(openStatusMenu.id, option.value)}
                  >
                    <span className={`status-dot status-dot-${option.tone}`}></span>
                    <span>{option.label}</span>
                    <span className="status-menu-check">{isActive ? "OK" : ""}</span>
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}

      {editTargetId ? (
        <div className="modal-backdrop" onClick={() => setEditTargetId(null)}>
          <div
            className="modal-card modal-card-wide modal-card-rich"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="section-label">Edit ticket</p>
            <h2>Update ticket details</h2>
            <div className="modal-form-grid">
              <label className="modal-field">
                <span>Ticket number</span>
                <input name="ticketNumber" value={editForm.ticketNumber} onChange={updateEditField} />
              </label>
              <label className="modal-field">
                <span>Status</span>
                <select name="status" value={editForm.status} onChange={updateEditField}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="modal-field">
                <span>Customer name</span>
                <input name="customerName" value={editForm.customerName} onChange={updateEditField} />
              </label>
              <label className="modal-field">
                <span>Check-in date</span>
                <input name="checkInDate" value={editForm.checkInDate} onChange={updateEditField} />
              </label>
              <label className="modal-field">
                <span>Phone number</span>
                <input name="phone" value={editForm.phone} onChange={updateEditField} />
              </label>
              <label className="modal-field">
                <span>Email</span>
                <input name="email" value={editForm.email} onChange={updateEditField} />
              </label>
              <label className="modal-field">
                <span>Password</span>
                <input name="password" value={editForm.password} onChange={updateEditField} />
              </label>
              <label className="modal-field modal-field-wide">
                <span>Device</span>
                <input name="device" value={editForm.device} onChange={updateEditField} />
              </label>
              <label className="modal-field modal-field-wide">
                <span>Problem description</span>
                <textarea name="issue" rows="4" value={editForm.issue} onChange={updateEditField} />
              </label>
              <label className="modal-field modal-field-wide">
                <span>Accessories left with device</span>
                <input name="accessories" value={editForm.accessories} onChange={updateEditField} />
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setEditTargetId(null)}
              >
                Cancel
              </button>
              <button type="button" className="button-primary" onClick={handleEditSave}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTargetId ? (
        <div className="modal-backdrop" onClick={() => setDeleteTargetId(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <p className="section-label">Delete ticket</p>
            <h2>Are you sure you would like to delete this ticket?</h2>
            <p className="modal-copy">This cannot be undone.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-danger"
                onClick={() => handleDelete(deleteTargetId)}
              >
                Delete ticket
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="modal-backdrop" onClick={() => setNotice(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
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
    </>
  );
}
