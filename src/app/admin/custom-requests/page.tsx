"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { CustomRequestItem } from "@/lib/admin/admin-data";
import { CustomRequestStatus } from "@/types/database.types";
import { useToast } from "@/components/ui/toast";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import {
  getCustomRequestStatusMeta,
  formatIST,
} from "@/lib/custom-requests/constants";
import {
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  ExternalLink,
  ImageIcon,
  Send,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Loader2,
  Check,
  Compass,
} from "lucide-react";

export default function AdminCustomRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<CustomRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Track expanded cards for detailed timeline & form
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form states per request
  const [actionStatus, setActionStatus] = useState<Record<string, string>>({});
  const [customerMessage, setCustomerMessage] = useState<Record<string, string>>({});
  const [internalNote, setInternalNote] = useState<Record<string, string>>({});
  const [sendEmailFlag, setSendEmailFlag] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resendingEventId, setResendingEventId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/custom-requests");
      if (res.status === 403) {
        showToast("Access forbidden: Artisan admin authorization required.", "error");
        setRequests([]);
        return;
      }
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to load custom requests", err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const toggleExpand = (id: string, currentStatus: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!actionStatus[id]) {
        setActionStatus((prev) => ({ ...prev, [id]: currentStatus }));
      }
      if (sendEmailFlag[id] === undefined) {
        setSendEmailFlag((prev) => ({ ...prev, [id]: true }));
      }
    }
  };

  const handleSaveUpdate = async (reqItem: CustomRequestItem) => {
    const id = reqItem.id;
    if (savingId === id) return; // Prevent double submit

    setSavingId(id);
    const newStatus = actionStatus[id] || reqItem.status;
    const msg = customerMessage[id]?.trim() || "";
    const note = internalNote[id]?.trim() || "";
    const sendMail = sendEmailFlag[id] !== false;
    const idempotencyKey = `adm_update_${id}_${Date.now()}`;

    try {
      const res = await fetch("/api/admin/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          status: newStatus,
          customerMessage: msg || null,
          internalNote: note || null,
          sendEmail: sendMail,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update custom request.");
      }

      showToast("Commission timeline updated & notification sent!", "success");

      // Clear draft message
      setCustomerMessage((prev) => ({ ...prev, [id]: "" }));
      setInternalNote((prev) => ({ ...prev, [id]: "" }));

      // Refresh list to fetch updated events and timestamps
      await fetchRequests();
    } catch (err: any) {
      showToast(err.message || "Failed to save update", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleResendEmail = async (eventId: string) => {
    if (resendingEventId === eventId) return;
    setResendingEventId(eventId);
    try {
      const res = await fetch("/api/admin/custom-requests/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend email.");
      }
      showToast("Email dispatched to customer successfully!", "success");
      await fetchRequests();
    } catch (err: any) {
      showToast(err.message || "Failed to resend email.", "error");
    } finally {
      setResendingEventId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const availableStatuses: { value: string; label: string }[] = [
    { value: "new", label: "Submitted (new)" },
    { value: "reviewing", label: "Under review (reviewing)" },
    { value: "quoted", label: "Quote shared (quoted)" },
    { value: "accepted", label: "Accepted (accepted)" },
    { value: "in_progress", label: "Being crafted (in_progress)" },
    { value: "completed", label: "Completed (completed)" },
    { value: "cancelled", label: "Cancelled (cancelled)" },
    { value: "reviewed", label: "Reviewed (legacy)" },
    { value: "in_discussion", label: "In Discussion (legacy)" },
    { value: "declined", label: "Declined (legacy)" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="border-b border-steel/20 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Bespoke Commissions
          </span>
          <h1 className="font-heading text-3xl uppercase tracking-wider text-bone mt-1">
            Custom Build Inquiries
          </h1>
          <p className="text-xs text-steel font-mono mt-1">
            Review personalized requests, manage client proposals, and dispatch status updates with live tracking tokens.
          </p>
        </div>

        <div className="text-xs font-mono text-steel bg-ash px-3.5 py-2 border border-steel/20 rounded">
          Total in archive: <span className="text-acid font-bold">{requests.length}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: "all", label: "All Inquiries" },
          { id: "new", label: "Submitted" },
          { id: "reviewing", label: "Under Review" },
          { id: "quoted", label: "Quote Shared" },
          { id: "accepted", label: "Accepted" },
          { id: "in_progress", label: "Being Crafted" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" },
        ].map((tab) => {
          const isSelected = statusFilter === tab.id;
          const count =
            tab.id === "all"
              ? requests.length
              : requests.filter((r) => r.status === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors whitespace-nowrap flex items-center gap-2 ${
                isSelected
                  ? "bg-acid text-void font-bold shadow-sm"
                  : "bg-ash border border-steel/20 text-steel hover:text-bone"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? "bg-void text-acid" : "bg-void text-steel"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div className="p-16 text-center text-steel font-mono text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-acid animate-spin" />
          <span>Retrieving commission requests archive...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 bg-ash border border-steel/20 rounded text-center text-steel font-mono text-xs">
          No custom requests found under this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isExpanded = expandedId === req.id;
            const meta = getCustomRequestStatusMeta(req.status);
            const cleanPhone = req.phone.replace(/\D/g, "");
            const refCode = req.ref_code || `CR-${req.id.slice(0, 8).toUpperCase()}`;
            const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
              `Hello ${req.name}, this is CLAWCRAFT Studio regarding your custom can sculpture commission inquiry [${refCode}].`
            )}`;
            const publicTrackUrl = req.public_token
              ? `/track/custom?ref=${encodeURIComponent(refCode)}&t=${encodeURIComponent(req.public_token)}`
              : null;

            return (
              <div
                key={req.id}
                className="relative bg-ash border border-steel/20 rounded shadow-md overflow-hidden transition-all hover:border-steel/35"
              >
                <FiligreeCorner position="top-right" size={12} />

                {/* Primary Row Summary */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-acid tracking-wider">
                        {refCode}
                      </span>
                      <span className="font-heading text-lg uppercase text-bone">
                        {req.name}
                      </span>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 border rounded-sm ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </div>

                    <p className="text-xs text-bone/90 line-clamp-1 italic font-sans">
                      &quot;{req.concept_description}&quot;
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-steel">
                      <span>Submitted: {formatIST(req.created_at)}</span>
                      <span>•</span>
                      <span className="text-bone">
                        Last Update: {formatIST(req.last_status_change_at || req.created_at)}
                      </span>
                      <span>•</span>
                      <span>Cans: {req.preferred_can_types || "Studio Selection"}</span>
                      <span>•</span>
                      <span>Budget: {req.budget_inr || "Flexible"}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2.5 self-start lg:self-center">
                    {publicTrackUrl && (
                      <a
                        href={publicTrackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-void border border-steel/20 hover:border-acid text-steel hover:text-acid text-xs font-mono uppercase rounded transition-colors inline-flex items-center gap-1.5"
                        title="Open customer private tracking link"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Track</span>
                      </a>
                    )}

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40 rounded text-xs transition-colors font-mono uppercase inline-flex items-center gap-1.5 font-bold"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => toggleExpand(req.id, req.status)}
                      className="px-3.5 py-1.5 bg-void border border-steel/30 hover:border-bone text-bone text-xs font-mono uppercase rounded transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{isExpanded ? "Collapse" : "Manage & Timeline"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detail View */}
                {isExpanded && (
                  <div className="border-t border-steel/20 p-6 bg-void/50 space-y-6">
                    {/* Full Description & Reference Visuals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <span className="font-mono text-xs uppercase tracking-wider text-steel block">
                          Full Concept Narrative
                        </span>
                        <div className="p-4 bg-ash border border-steel/20 rounded text-xs text-bone leading-relaxed whitespace-pre-wrap font-sans">
                          {req.concept_description}
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs font-mono text-steel">
                          <div>
                            <span className="text-[10px] block uppercase text-steel">Email:</span>
                            <a href={`mailto:${req.email}`} className="text-bone hover:text-acid underline">
                              {req.email}
                            </a>
                          </div>
                          <div>
                            <span className="text-[10px] block uppercase text-steel">Mobile Phone:</span>
                            <a href={`tel:${req.phone}`} className="text-bone hover:text-acid">
                              +91 {req.phone}
                            </a>
                          </div>
                          <div>
                            <span className="text-[10px] block uppercase text-steel">Target Size:</span>
                            <span className="text-bone">{req.estimated_size || "Desktop"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Reference Visuals */}
                      <div className="space-y-3">
                        <span className="font-mono text-xs uppercase tracking-wider text-steel block">
                          Reference Visuals ({req.reference_image_urls?.length || 0})
                        </span>
                        {req.reference_image_urls && req.reference_image_urls.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2.5">
                            {req.reference_image_urls.map((imgUrl, i) => (
                              <a
                                key={i}
                                href={imgUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative aspect-square bg-ash border border-steel/20 rounded overflow-hidden hover:border-acid block group"
                              >
                                <Image
                                  src={imgUrl}
                                  alt="Reference visual"
                                  fill
                                  sizes="120px"
                                  className="object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-void/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ExternalLink className="w-3.5 h-3.5 text-acid" />
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 bg-ash border border-steel/20 rounded text-center text-xs font-mono text-steel">
                            No reference images provided by client.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline of Events */}
                    <div className="border-t border-steel/20 pt-6 space-y-3">
                      <span className="font-mono text-xs uppercase tracking-wider text-steel block">
                        Commission Timeline &amp; Event Log
                      </span>

                      {req.events && req.events.length > 0 ? (
                        <div className="space-y-2.5">
                          {req.events.map((ev) => {
                            const evMeta = getCustomRequestStatusMeta(ev.status);
                            const isResending = resendingEventId === ev.id;

                            return (
                              <div
                                key={ev.id}
                                className="p-3.5 bg-ash border border-steel/20 rounded flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                              >
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.2 text-[10px] font-mono uppercase rounded border ${evMeta.badgeClass}`}>
                                      {evMeta.label}
                                    </span>
                                    <span className="font-mono text-[11px] text-steel">
                                      {formatIST(ev.created_at)}
                                    </span>
                                  </div>

                                  {ev.customer_message && (
                                    <p className="text-xs text-bone bg-void/60 p-2 rounded border-l-2 border-acid">
                                      <strong className="text-acid text-[10px] font-mono uppercase block">Customer Message:</strong>
                                      {ev.customer_message}
                                    </p>
                                  )}

                                  {ev.internal_note && (
                                    <p className="text-xs text-amber-300 bg-void/60 p-2 rounded border-l-2 border-amber-500">
                                      <strong className="text-amber-400 text-[10px] font-mono uppercase block">Internal Note (Private):</strong>
                                      {ev.internal_note}
                                    </p>
                                  )}
                                </div>

                                {/* Email Status & Resend */}
                                <div className="shrink-0 text-right">
                                  {ev.email_sent_at ? (
                                    <div className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Email sent {formatIST(ev.email_sent_at)}</span>
                                    </div>
                                  ) : ev.email_error ? (
                                    <div className="space-y-1">
                                      <div className="inline-flex items-center gap-1 text-[11px] font-mono text-blood">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        <span title={ev.email_error}>Email failed: {ev.email_error.slice(0, 30)}...</span>
                                      </div>
                                      <div>
                                        <button
                                          type="button"
                                          disabled={isResending}
                                          onClick={() => handleResendEmail(ev.id)}
                                          className="text-[10px] font-mono uppercase text-acid hover:underline inline-flex items-center gap-1"
                                        >
                                          <RotateCcw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
                                          <span>Resend Email</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] font-mono text-steel">No email dispatched</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-ash border border-steel/20 rounded text-xs font-mono text-steel">
                          No events recorded yet.
                        </div>
                      )}
                    </div>

                    {/* Workshop Update Action Form */}
                    <div className="border-t border-steel/20 pt-6 space-y-4">
                      <span className="font-mono text-xs uppercase tracking-wider text-acid font-bold block">
                        Record Progress &amp; Notify Customer
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-mono uppercase text-steel mb-1">
                            New Status:
                          </label>
                          <select
                            value={actionStatus[req.id] || req.status}
                            onChange={(e) =>
                              setActionStatus((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            className="w-full bg-ash border border-steel/30 px-3 py-2 text-xs text-bone font-mono rounded focus:border-acid focus:outline-none"
                          >
                            {availableStatuses.map((st) => (
                              <option key={st.value} value={st.value}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-mono uppercase text-steel mb-1">
                            Message to Customer (included in email + public tracking, max 1000 chars):
                          </label>
                          <textarea
                            rows={2}
                            maxLength={1000}
                            value={customerMessage[req.id] || ""}
                            onChange={(e) =>
                              setCustomerMessage((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            placeholder="e.g. Can palette curated and initial armature framework assembled. Proceeding to surface riveting."
                            className="w-full bg-ash border border-steel/30 px-3 py-2 text-xs text-bone placeholder:text-steel/50 focus:border-acid focus:outline-none rounded font-sans"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-steel mb-1">
                          Artisan Internal Note (Private to workshop, never shown to customer, max 2000 chars):
                        </label>
                        <input
                          type="text"
                          maxLength={2000}
                          value={internalNote[req.id] || ""}
                          onChange={(e) =>
                            setInternalNote((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          placeholder="e.g. Quoted ₹18,500. Awaiting customer reply on WhatsApp."
                          className="w-full bg-ash border border-steel/30 px-3 py-2 text-xs text-amber-200 placeholder:text-steel/50 focus:border-amber-400 focus:outline-none rounded font-mono"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-mono text-steel">
                          <input
                            type="checkbox"
                            checked={sendEmailFlag[req.id] !== false}
                            onChange={(e) =>
                              setSendEmailFlag((prev) => ({ ...prev, [req.id]: e.target.checked }))
                            }
                            className="rounded border-steel/30 bg-ash text-acid focus:ring-acid"
                          />
                          <span>Email customer update notification</span>
                        </label>

                        <button
                          type="button"
                          disabled={savingId === req.id}
                          onClick={() => handleSaveUpdate(req)}
                          className="px-6 py-2.5 bg-acid hover:bg-lime-400 text-void font-mono text-xs uppercase font-bold tracking-wider rounded transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                        >
                          {savingId === req.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Saving Update...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Save Update &amp; Log Event</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
