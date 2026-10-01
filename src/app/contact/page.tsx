"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClawButton } from "@/components/ui/claw-button";
import { ClawDivider } from "@/components/ui/claw-divider";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { useToast } from "@/components/ui/toast";
import {
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Instagram,
  ArrowRight,
} from "lucide-react";

export default function ContactPage() {
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("General Inquiry");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Provide immediate client-side handling and WhatsApp bridge
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      showToast("Message recorded! Opening direct studio connection...", "success");
    }, 600);
  };

  const whatsappDirectUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
    `Hello CLAWCRAFT Studio! My name is ${name || "a collector"}. I have a query regarding: ${subject}${
      orderNumber ? ` (Order #${orderNumber})` : ""
    }.\n\nMessage: ${message}`
  )}`;

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
            Need order assistance, custom commission guidance, or studio details? Connect directly with our Indian workshop artisan.
          </p>
          <ClawDivider variant="acid" className="my-6 max-w-xs mx-auto" />
        </div>

        {/* Contact Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* WhatsApp Direct */}
          <div className="relative bg-ash border border-subtle p-6 rounded space-y-3">
            <FiligreeCorner position="top-right" size={12} />
            <div className="w-10 h-10 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-lg uppercase text-bone">WhatsApp Support</h3>
            <p className="text-xs text-muted font-body leading-relaxed">
              Fastest response time for commission sketches, delivery inquiries, and order help.
            </p>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:underline pt-1"
            >
              <span>+91 98765 43210</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Email Support */}
          <div className="relative bg-ash border border-subtle p-6 rounded space-y-3">
            <FiligreeCorner position="top-right" size={12} />
            <div className="w-10 h-10 rounded bg-void border border-acid/40 text-acid flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-lg uppercase text-bone">Email Desk</h3>
            <p className="text-xs text-muted font-body leading-relaxed">
              Send detailed blueprints, bulk gallery requests, or corporate gifting proposals.
            </p>
            <div className="space-y-1 text-xs font-mono">
              <a
                href="mailto:studio@clawcraft.in"
                className="block text-bone hover:text-acid transition-colors"
              >
                studio@clawcraft.in
              </a>
              <a
                href="mailto:orders@clawcraft.in"
                className="block text-muted hover:text-bone transition-colors"
              >
                orders@clawcraft.in
              </a>
            </div>
          </div>

          {/* Studio Workshop Hours */}
          <div className="relative bg-ash border border-subtle p-6 rounded space-y-3">
            <FiligreeCorner position="top-right" size={12} />
            <div className="w-10 h-10 rounded bg-void border border-steel/40 text-steel flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-lg uppercase text-bone">Artisan Hours</h3>
            <p className="text-xs text-muted font-body leading-relaxed">
              Active workshop fabrication and fulfillment hours:
            </p>
            <div className="text-xs font-mono space-y-1 text-muted">
              <p className="text-bone">Monday – Saturday: 10 AM – 8 PM IST</p>
              <p>Sunday: Workshop Prep & Sketch Review</p>
            </div>
          </div>
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
                Thank you, {name}. We will review your inquiry and reply via email or WhatsApp within a few hours.
              </p>
              <div className="pt-2">
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-void font-bold text-xs font-mono uppercase tracking-wider rounded transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Instant Follow-Up on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6 border-b border-subtle pb-4">
                <h2 className="font-heading text-xl sm:text-2xl uppercase tracking-wider text-bone">
                  Send a Direct Message
                </h2>
                <p className="text-xs text-muted font-mono mt-1">
                  We reply to every collector and inquiry personally.
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
                      placeholder="9811223344"
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
