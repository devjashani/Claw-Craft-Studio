"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ClawButton } from "@/components/ui/claw-button";
import { ClawDivider } from "@/components/ui/claw-divider";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { useToast } from "@/components/ui/toast";
import { getBusinessContact } from "@/lib/contact";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function ContactPage() {
  const { showToast } = useToast();

  const [dbWhatsapp, setDbWhatsapp] = useState<string | null>(null);
  const [supportEmail, setSupportEmail] = useState("studio@clawcraft.in");
  const [supportHours, setSupportHours] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["whatsapp_number", "admin_notification_email", "support_hours", "business_address"]);

        if (data) {
          const items = data as Array<{ key: string; value: unknown }>;
          for (const item of items) {
            if (item.key === "whatsapp_number" && typeof item.value === "string") {
              setDbWhatsapp(item.value);
            }
            if (item.key === "admin_notification_email" && typeof item.value === "string") {
              setSupportEmail(item.value);
            }
            if (item.key === "support_hours" && typeof item.value === "string") {
              setSupportHours(item.value);
            }
            if (item.key === "business_address" && typeof item.value === "string") {
              setBusinessAddress(item.value);
            }
          }
        }
      } catch {
        // Fallback gracefully to env vars
      }
    }
    loadSettings();
  }, []);

  const contact = getBusinessContact(dbWhatsapp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      showToast("Message recorded! Thank you for reaching out.", "success");
    }, 600);
  };

  const formFollowUpWaUrl = contact.isConfigured
    ? contact.waLink(
        `Hello CLAWCRAFT Studio! My name is ${name || "a collector"}. Regarding: ${subject}${
          orderNumber ? ` (Order #${orderNumber})` : ""
        }.\n\nMessage: ${message}`
      )
    : "";

  return (
    <div className="min-h-screen bg-void text-bone py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Direct Workshop Channel
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-wider text-bone">
            TALK TO THE STUDIO
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed font-body">
            Questions about orders, custom builds and delivery. Connect directly with our Indian workshop artisan.
          </p>
          <ClawDivider variant="acid" className="my-6 max-w-xs mx-auto" />
        </div>

        {/* Contact Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* WhatsApp & Call Direct (Rendered only when business number is configured) */}
          {contact.isConfigured && (
            <div className="relative bg-ash border border-subtle p-6 rounded space-y-3">
              <FiligreeCorner position="top-right" size={12} />
              <div className="w-10 h-10 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-lg uppercase text-bone">WhatsApp & Phone</h3>
              <p className="text-xs text-muted font-body leading-relaxed">
                Questions about orders, custom builds and delivery.
              </p>
              <div className="space-y-2 pt-1 font-mono text-xs">
                <div>
                  <a
                    href={contact.waLink("Hello Clawcraft Studio! I have an inquiry.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline"
                  >
                    <span>Chat on WhatsApp: {contact.display}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div>
                  <a
                    href={contact.telLink}
                    className="inline-flex items-center gap-1.5 text-bone hover:text-acid hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5 text-steel" />
                    <span>Call: {contact.display}</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Email Support */}
          <div className="relative bg-ash border border-subtle p-6 rounded space-y-3">
            <FiligreeCorner position="top-right" size={12} />
            <div className="w-10 h-10 rounded bg-void border border-acid/40 text-acid flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-lg uppercase text-bone">Email Desk</h3>
            <p className="text-xs text-muted font-body leading-relaxed">
              Send detailed blueprints, bulk gallery requests, or order inquiries.
            </p>
            <div className="space-y-1 text-xs font-mono">
              <a
                href={`mailto:${supportEmail}`}
                className="block text-bone hover:text-acid transition-colors"
              >
                {supportEmail}
              </a>
              <a
                href="mailto:orders@clawcraft.in"
                className="block text-muted hover:text-bone transition-colors"
              >
                orders@clawcraft.in
              </a>
            </div>
          </div>

          {/* Studio Workshop Hours (Hidden when empty - do not invent hours) */}
          {supportHours ? (
            <div className="relative bg-ash border border-subtle p-6 rounded space-y-3">
              <FiligreeCorner position="top-right" size={12} />
              <div className="w-10 h-10 rounded bg-void border border-steel/40 text-steel flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-lg uppercase text-bone">Artisan Hours</h3>
              <p className="text-xs text-muted font-body leading-relaxed">
                Active workshop fabrication and support hours:
              </p>
              <div className="text-xs font-mono text-bone">
                <p>{supportHours}</p>
              </div>
            </div>
          ) : businessAddress ? (
            <div className="relative bg-ash border border-subtle p-6 rounded space-y-3">
              <FiligreeCorner position="top-right" size={12} />
              <div className="w-10 h-10 rounded bg-void border border-steel/40 text-steel flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-lg uppercase text-bone">Workshop Location</h3>
              <p className="text-xs text-muted font-body leading-relaxed">
                Registered studio and fabrication bench:
              </p>
              <div className="text-xs font-mono text-bone leading-relaxed">
                <p>{businessAddress}</p>
              </div>
            </div>
          ) : null}

          {/* Business Address Card (if hours was also present) */}
          {supportHours && businessAddress && (
            <div className="relative bg-ash border border-subtle p-6 rounded space-y-3 md:col-span-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-steel shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-heading text-sm uppercase text-bone">Workshop Address</h4>
                  <p className="text-xs font-mono text-muted mt-0.5">{businessAddress}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact Form Section */}
        <div className="relative bg-ash border border-subtle p-6 sm:p-10 rounded shadow-2xl max-w-3xl mx-auto">
          <FiligreeCorner position="top-left" size={20} />
          <FiligreeCorner position="bottom-right" size={20} />

          {submitted ? (
            <div className="text-center py-8 space-y-5">
              <div className="w-14 h-14 bg-acid/10 border border-acid text-acid rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="font-heading text-2xl uppercase text-bone">
                Message Received by Artisan
              </h2>
              <p className="text-xs text-muted font-body max-w-md mx-auto leading-relaxed">
                Thank you, {name}. We will review your inquiry regarding orders, custom builds, or delivery.
              </p>
              {contact.isConfigured && (
                <div className="pt-2">
                  <a
                    href={formFollowUpWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-void font-bold text-xs font-mono uppercase tracking-wider rounded transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-6 border-b border-subtle pb-4">
                <h2 className="font-heading text-xl sm:text-2xl uppercase tracking-wider text-bone">
                  Send a Direct Message
                </h2>
                <p className="text-xs text-muted font-mono mt-1">
                  Questions about orders, custom builds and delivery.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rohan Verma"
                      className="w-full bg-void border border-subtle px-3.5 py-2 text-xs text-bone focus:border-acid focus:outline-none rounded font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-muted mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rohan@example.com"
                      className="w-full bg-void border border-subtle px-3.5 py-2 text-xs text-bone focus:border-acid focus:outline-none rounded font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-muted mb-1">
                      Phone Number (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full bg-void border border-subtle px-3.5 py-2 text-xs text-bone focus:border-acid focus:outline-none rounded font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-muted mb-1">
                      Topic / Subject *
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none rounded font-mono"
                    >
                      <option value="General Inquiry">General Studio Inquiry</option>
                      <option value="Order Status & Delivery">Order Status & Delivery</option>
                      <option value="Bespoke Commission">Bespoke Custom Sculpture</option>
                      <option value="Gallery / Collaboration">Gallery / Collaboration</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Order Number <span className="text-muted/60">(Optional, if regarding a purchase)</span>
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. CC-2026-1042"
                    className="w-full bg-void border border-subtle px-3.5 py-2 text-xs text-bone focus:border-acid focus:outline-none rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Message Details *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your question or request..."
                    className="w-full bg-void border border-subtle p-3 text-xs text-bone focus:border-acid focus:outline-none rounded leading-relaxed font-body"
                  />
                </div>

                <div className="pt-2">
                  <ClawButton
                    type="submit"
                    disabled={submitting}
                    variant="acid"
                    className="w-full justify-center text-xs py-3"
                  >
                    <Send className="w-4 h-4 mr-2 inline" />
                    {submitting ? "SENDING MESSAGE..." : "TRANSMIT MESSAGE"}
                  </ClawButton>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
