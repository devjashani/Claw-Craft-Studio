"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { CustomRequestItem } from "@/lib/admin/admin-data";
import { CustomRequestStatus } from "@/types/database.types";
import { useToast } from "@/components/ui/toast";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import {
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  Calendar,
  Save,
  CheckCircle2,
  Clock,
  ExternalLink,
  ImageIcon,
} from "lucide-react";

export default function AdminCustomRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<CustomRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/custom-requests");
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error("Failed to load custom requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (id: string, newStatus: CustomRequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    try {
      await fetch("/api/admin/custom-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      showToast(`Status updated to ${newStatus}`, "success");
    } catch {
      showToast("Failed to update status", "error");
      fetchRequests();
    }
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    try {
      const reqItem = requests.find((r) => r.id === id);
      await fetch("/api/admin/custom-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: reqItem?.status || "new",
          admin_notes: notes,
        }),
      });
      showToast("Notes saved", "success");
    } catch {
      showToast("Failed to save notes", "error");
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const statusColors: Record<string, string> = {
    new: "bg-acid/10 border-acid text-acid",
    reviewed: "bg-blue-500/10 border-blue-500 text-blue-400",
    in_discussion: "bg-amber-500/10 border-amber-500 text-amber-400",
    accepted: "bg-emerald-500/10 border-emerald-500 text-emerald-400",
    declined: "bg-blood/10 border-blood text-blood",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="border-b border-subtle pb-6">
        <span className="font-mono text-xs uppercase tracking-widest text-acid">
          Bespoke Commissions
        </span>
        <h1 className="font-heading text-3xl uppercase tracking-wider text-bone mt-1">
          Custom Build Inquiries
        </h1>
        <p className="text-xs text-muted font-mono mt-1">
          Review personalized requests for custom can sculptures, logos, and gallery installations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: "all", label: "All Inquiries" },
          { id: "new", label: "New" },
          { id: "in_discussion", label: "In Discussion" },
          { id: "accepted", label: "Accepted" },
          { id: "declined", label: "Declined" },
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
                  ? "bg-acid text-void font-bold"
                  : "bg-ash border border-subtle text-muted hover:text-bone"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? "bg-void text-acid" : "bg-void text-muted"
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
        <div className="p-12 text-center text-muted font-mono text-xs">
          Loading commission requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 bg-ash border border-subtle rounded text-center text-muted font-mono text-xs">
          No custom requests found under this filter.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map((req) => {
            const cleanPhone = req.phone.replace(/\D/g, "");
            const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
              `Hello ${req.name}, this is CLAWCRAFT Studio regarding your custom can sculpture commission inquiry.`
            )}`;

            return (
              <div
                key={req.id}
                className="relative bg-ash border border-subtle p-6 rounded shadow-xl space-y-5"
              >
                <FiligreeCorner position="top-right" size={14} />

                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-subtle pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="font-heading text-xl uppercase text-bone">
                        {req.name}
                      </h2>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 border rounded-sm ${
                          statusColors[req.status] || "bg-subtle text-muted"
                        }`}
                      >
                        {req.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-muted font-mono">
                      Received {new Date(req.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-mono uppercase text-muted">
                      Status:
                    </label>
                    <select
                      value={req.status}
                      onChange={(e) =>
                        handleStatusChange(
                          req.id,
                          e.target.value as CustomRequestStatus
                        )
                      }
                      className="bg-void border border-subtle px-3 py-1.5 text-xs text-bone font-mono rounded focus:border-acid focus:outline-none"
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="in_discussion">In Discussion</option>
                      <option value="accepted">Accepted / In Production</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                </div>

                {/* Concept Narrative */}
                <div className="space-y-2">
                  <h3 className="font-heading text-sm uppercase text-bone flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-acid" />
                    <span>Concept Description</span>
                  </h3>
                  <div className="p-4 bg-void/70 border border-subtle rounded text-sm text-bone/90 leading-relaxed font-body">
                    {req.concept_description}
                  </div>
                </div>

                {/* Scope & Collector Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3 bg-void/40 border border-subtle rounded">
                    <span className="text-muted block text-[10px] uppercase">
                      Preferred Cans / Palette
                    </span>
                    <span className="text-bone font-bold mt-1 block">
                      {req.preferred_can_types || "Not specified"}
                    </span>
                  </div>

                  <div className="p-3 bg-void/40 border border-subtle rounded">
                    <span className="text-muted block text-[10px] uppercase">
                      Target Dimensions
                    </span>
                    <span className="text-bone font-bold mt-1 block">
                      {req.estimated_size || "Not specified"}
                    </span>
                  </div>

                  <div className="p-3 bg-void/40 border border-subtle rounded">
                    <span className="text-muted block text-[10px] uppercase">
                      Budget (INR)
                    </span>
                    <span className="text-acid font-bold mt-1 block">
                      {req.budget_inr || "Flexible"}
                    </span>
                  </div>
                </div>

                {/* Reference Images */}
                {req.reference_image_urls && req.reference_image_urls.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-heading text-xs uppercase text-muted flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-steel" />
                      <span>Reference Visuals ({req.reference_image_urls.length})</span>
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {req.reference_image_urls.map((imgUrl, idx) => (
                        <a
                          key={idx}
                          href={imgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative w-20 h-20 bg-void border border-subtle rounded overflow-hidden hover:border-acid transition-colors group"
                        >
                          <Image
                            src={imgUrl}
                            alt="Reference"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="80px"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Links & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-subtle">
                  <div className="space-y-2 text-xs font-mono">
                    <p className="text-[10px] text-muted uppercase">Collector Contact:</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={`mailto:${req.email}`}
                        className="inline-flex items-center gap-1.5 text-muted hover:text-bone transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-steel" />
                        <span>{req.email}</span>
                      </a>

                      <a
                        href={`tel:${req.phone}`}
                        className="inline-flex items-center gap-1.5 text-muted hover:text-bone transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-steel" />
                        <span>+91 {req.phone}</span>
                      </a>
                    </div>

                    <div>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40 rounded text-xs transition-colors font-bold mt-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Discuss Commission on WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Workshop Notes */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-mono text-muted uppercase">
                      Artisan Studio Notes:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={req.admin_notes || ""}
                        id={`notes-${req.id}`}
                        placeholder="Internal pricing thoughts, quote sent, sketch done..."
                        className="flex-1 bg-void border border-subtle px-3 py-1.5 text-xs text-bone font-mono focus:border-acid focus:outline-none rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(
                            `notes-${req.id}`
                          ) as HTMLInputElement;
                          if (input) handleSaveNotes(req.id, input.value);
                        }}
                        className="px-3 py-1.5 bg-void border border-subtle hover:border-steel text-bone text-xs font-mono uppercase rounded transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
