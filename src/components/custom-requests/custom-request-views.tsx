"use client";

import React from "react";
import Image from "next/image";
import { CustomerCustomRequestDetail, CustomerTimelineEvent } from "@/lib/custom-requests/service";
import {
  getCustomRequestStatusMeta,
  LIFECYCLE_STEPS,
  formatIST,
} from "@/lib/custom-requests/constants";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Layers,
  Maximize2,
  Coins,
  ImageIcon,
  XCircle,
  ExternalLink,
} from "lucide-react";

export function CustomRequestStepper({ status }: { status: string }) {
  const meta = getCustomRequestStatusMeta(status);
  const isCancelled = meta.stepIndex === -1;

  if (isCancelled) {
    return (
      <div className="p-4 sm:p-5 bg-blood/10 border border-blood/40 rounded flex items-center gap-3">
        <XCircle className="w-5 h-5 text-blood shrink-0" />
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-blood font-bold">
            STATUS: CANCELLED / CLOSED
          </span>
          <p className="text-xs text-muted mt-0.5">{meta.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Mobile progress indicator */}
      <div className="sm:hidden flex items-center justify-between p-3.5 bg-ash border border-steel/20 rounded">
        <div>
          <span className="font-mono text-[10px] uppercase text-steel tracking-wider">Current Stage</span>
          <p className="font-mono text-xs uppercase text-acid font-bold mt-0.5">
            Step {meta.stepIndex + 1} of 6: {meta.label}
          </p>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${meta.badgeClass}`}>
          Active
        </span>
      </div>

      {/* Desktop Stepper */}
      <div className="hidden sm:grid grid-cols-6 gap-2">
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isDone = meta.stepIndex > idx;
          const isCurrent = meta.stepIndex === idx;

          let cardStyle = "bg-ash/40 border-steel/20 text-steel";
          let circleStyle = "bg-void border-steel/30 text-steel";

          if (isDone) {
            cardStyle = "bg-ash/80 border-acid/30 text-bone";
            circleStyle = "bg-acid text-void border-acid font-bold";
          } else if (isCurrent) {
            cardStyle = "bg-ash border-acid text-acid shadow-[0_0_15px_rgba(184,255,31,0.1)]";
            circleStyle = "bg-void border-acid text-acid animate-pulse font-bold";
          }

          return (
            <div
              key={step.key}
              className={`p-3 rounded border transition-colors flex flex-col justify-between ${cardStyle}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider">
                  0{idx + 1}
                </span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${circleStyle}`}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
              </div>
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-tight block">
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current stage description */}
      <div className="p-4 bg-ash/70 border border-steel/20 rounded flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-acid shrink-0 mt-0.5" />
        <div>
          <div className="font-mono text-xs uppercase text-bone font-bold tracking-wider">
            {meta.label}
          </div>
          <p className="text-xs text-steel mt-0.5 leading-relaxed">{meta.description}</p>
        </div>
      </div>
    </div>
  );
}

export function CustomRequestTimeline({ events }: { events: CustomerTimelineEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center border border-steel/20 bg-ash/50 rounded">
        <Clock className="w-5 h-5 text-steel mx-auto mb-2" />
        <p className="font-mono text-xs text-steel">No timeline events logged yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-sm uppercase tracking-wider text-bone flex items-center gap-2">
        <Clock className="w-4 h-4 text-acid" />
        <span>Workshop Updates & Timeline</span>
      </h3>

      <div className="relative pl-6 border-l-2 border-steel/20 space-y-6">
        {events.map((ev, idx) => {
          const meta = getCustomRequestStatusMeta(ev.status);
          const isLatest = idx === events.length - 1;

          return (
            <div key={ev.id || idx} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                  isLatest
                    ? "bg-acid border-void ring-4 ring-acid/20"
                    : "bg-void border-steel/40"
                }`}
              />

              <div className="p-4 bg-ash border border-steel/20 rounded shadow-sm hover:border-steel/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-steel">
                    {formatIST(ev.created_at)}
                  </span>
                </div>

                {ev.customer_message && (
                  <div className="mt-2.5 p-3 bg-void/80 border-l-2 border-acid rounded text-xs text-bone leading-relaxed whitespace-pre-wrap font-sans">
                    {ev.customer_message}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CustomRequestSpecs({ request }: { request: CustomerCustomRequestDetail }) {
  const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
    `Hello CLAWCRAFT Studio, I'm checking in on my custom build request [${request.ref_code}].`
  )}`;

  return (
    <div className="space-y-6">
      {/* Specifications grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-ash border border-steel/20 rounded">
          <div className="flex items-center gap-1.5 text-steel font-mono text-[10px] uppercase mb-1">
            <Layers className="w-3.5 h-3.5 text-acid" />
            <span>Preferred Cans</span>
          </div>
          <p className="font-mono text-xs text-bone font-bold truncate">
            {request.preferred_can_types || "Studio Selection"}
          </p>
        </div>

        <div className="p-3.5 bg-ash border border-steel/20 rounded">
          <div className="flex items-center gap-1.5 text-steel font-mono text-[10px] uppercase mb-1">
            <Maximize2 className="w-3.5 h-3.5 text-acid" />
            <span>Target Size</span>
          </div>
          <p className="font-mono text-xs text-bone font-bold truncate">
            {request.estimated_size || "Desktop (Standard)"}
          </p>
        </div>

        <div className="p-3.5 bg-ash border border-steel/20 rounded">
          <div className="flex items-center gap-1.5 text-steel font-mono text-[10px] uppercase mb-1">
            <Coins className="w-3.5 h-3.5 text-acid" />
            <span>Budget Target</span>
          </div>
          <p className="font-mono text-xs text-bone font-bold truncate">
            {request.budget_inr || "Flexible"}
          </p>
        </div>
      </div>

      {/* Concept block */}
      <div className="p-4 bg-ash border border-steel/20 rounded space-y-2">
        <span className="font-mono text-[10px] uppercase text-steel tracking-wider">
          Submitted Design Concept
        </span>
        <p className="text-xs sm:text-sm text-bone leading-relaxed whitespace-pre-wrap">
          {request.concept_description}
        </p>
      </div>

      {/* Reference Images if any */}
      {request.reference_image_urls && request.reference_image_urls.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-steel">
            <ImageIcon className="w-3.5 h-3.5 text-acid" />
            <span>Reference Visuals ({request.reference_image_urls.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {request.reference_image_urls.map((imgUrl, i) => (
              <a
                key={i}
                href={imgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square bg-void border border-steel/20 rounded overflow-hidden block hover:border-acid transition-colors"
              >
                <Image
                  src={imgUrl}
                  alt={`Reference visual ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-void/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-acid" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Help CTA */}
      <div className="pt-2 flex justify-start">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-void font-mono text-xs uppercase font-bold tracking-wider rounded transition-colors shadow-md"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Ask About This Request (WhatsApp)</span>
        </a>
      </div>
    </div>
  );
}
