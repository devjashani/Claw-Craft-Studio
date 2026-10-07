"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Address } from "@/types/shop";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { useToast } from "@/components/ui/toast";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  Star,
  Loader2,
  AlertCircle,
  X,
  Phone,
  User,
  Building,
} from "lucide-react";

interface SavedAddressesProps {
  userId: string;
}

export function SavedAddresses({ userId }: SavedAddressesProps) {
  const toast = useToast();
  const supabase = createClient();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form fields
  const [label, setLabel] = useState("Home");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [pin, setPin] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch addresses
  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAddresses((data as Address[]) || []);
    } catch (err: any) {
      console.warn("[SavedAddresses Load Error]", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Open modal for new address
  const handleAddNew = () => {
    setEditingAddress(null);
    setLabel("Home");
    setFullName("");
    setPhone("");
    setLine1("");
    setLine2("");
    setPin("");
    setCity("");
    setStateVal("");
    setIsDefault(addresses.length === 0); // Default if first address
    setFormError(null);
    setModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setLabel(addr.label || "Home");
    setFullName(addr.full_name);
    setPhone(addr.phone);
    setLine1(addr.line1);
    setLine2(addr.line2 || "");
    setPin(addr.pin);
    setCity(addr.city);
    setStateVal(addr.state);
    setIsDefault(Boolean(addr.is_default));
    setFormError(null);
    setModalOpen(true);
  };

  // Delete address
  const handleDelete = async (addrId: string) => {
    if (!confirm("Are you sure you want to remove this delivery address?")) return;

    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addrId)
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Address Removed", "Address deleted from your vault.");
      setAddresses((prev) => prev.filter((a) => a.id !== addrId));
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to remove address.");
    }
  };

  // Set default address
  const handleSetDefault = async (addrId: string) => {
    try {
      // 1. Clear previous defaults
      await (supabase.from("addresses") as any)
        .update({ is_default: false })
        .eq("user_id", userId);

      // 2. Set this one as default
      const { error } = await (supabase.from("addresses") as any)
        .update({ is_default: true })
        .eq("id", addrId)
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Default Address Updated", "Pre-fills automatically at checkout.");
      await loadAddresses();
    } catch (err: any) {
      toast.error("Error", err.message || "Could not update default address.");
    }
  };

  // Submit address (Add or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length !== 10) {
      setFormError("Phone number must be a valid 10-digit Indian mobile number.");
      return;
    }

    const cleanPin = pin.replace(/[^0-9]/g, "");
    if (cleanPin.length !== 6) {
      setFormError("PIN code must be exactly 6 digits.");
      return;
    }

    setSubmitting(true);
    try {
      // If marking as default, clear others first
      if (isDefault) {
        await (supabase.from("addresses") as any)
          .update({ is_default: false })
          .eq("user_id", userId);
      }

      if (editingAddress) {
        // Update
        const { error } = await (supabase.from("addresses") as any)
          .update({
            label: label.trim() || "Home",
            full_name: fullName.trim(),
            phone: cleanPhone,
            line1: line1.trim(),
            line2: line2.trim() || null,
            pin: cleanPin,
            city: city.trim(),
            state: stateVal.trim(),
            is_default: isDefault,
          })
          .eq("id", editingAddress.id)
          .eq("user_id", userId);

        if (error) throw error;
        toast.success("Address Updated", "Delivery coordinates saved.");
      } else {
        // Insert
        const { error } = await (supabase.from("addresses") as any).insert({
          user_id: userId,
          label: label.trim() || "Home",
          full_name: fullName.trim(),
          phone: cleanPhone,
          line1: line1.trim(),
          line2: line2.trim() || null,
          pin: cleanPin,
          city: city.trim(),
          state: stateVal.trim(),
          is_default: isDefault || addresses.length === 0,
        } as any);

        if (error) throw error;
        toast.success("New Address Saved", "Added to your dispatch vault.");
      }

      setModalOpen(false);
      await loadAddresses();
    } catch (err: any) {
      setFormError(err.message || "Failed to save address.");
      toast.error("Error", err.message || "Could not save address.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display uppercase text-lg text-bone font-bold tracking-wider">
            Dispatch Coordinates
          </h3>
          <p className="font-sans text-xs text-steel">
            Manage your saved delivery destinations for effortless one-click acquisitions.
          </p>
        </div>

        <ClawButton variant="secondary" size="sm" onClick={handleAddNew}>
          <span className="flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-acid" />
            <span>Add Address</span>
          </span>
        </ClawButton>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-44 bg-ash/40 border border-steel/20 rounded-sm animate-pulse p-4"
            />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        /* Empty State */
        <div className="p-10 border border-dashed border-steel/30 rounded-sm text-center bg-ash/30 space-y-3">
          <div className="w-12 h-12 bg-steel/10 rounded-full flex items-center justify-center mx-auto text-steel">
            <MapPin className="w-6 h-6" />
          </div>
          <h4 className="font-display uppercase text-sm text-bone">No Saved Addresses</h4>
          <p className="font-sans text-xs text-steel max-w-sm mx-auto">
            You have not registered any delivery coordinates. Add your default address to prefill checkout instantly.
          </p>
          <div className="pt-2">
            <ClawButton variant="primary" size="sm" onClick={handleAddNew}>
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Address</span>
              </span>
            </ClawButton>
          </div>
        </div>
      ) : (
        /* Address Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-sm bg-ash/70 border relative backdrop-blur-sm transition-all ${
                addr.is_default
                  ? "border-acid/60 shadow-[0_0_15px_rgba(184,255,31,0.15)]"
                  : "border-steel/25 hover:border-steel/50"
              }`}
            >
              <FiligreeCorner
                position="top-right"
                size={16}
                variant={addr.is_default ? "acid" : "steel"}
              />

              {/* Card Header: Label & Default Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-void border border-steel/20 text-bone font-bold">
                  {addr.label || "Home"}
                </span>

                {addr.is_default ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-acid bg-acid/15 border border-acid/40 px-2 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-acid" /> Default
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-[10px] font-mono uppercase text-steel hover:text-acid transition-colors"
                  >
                    Set as Default
                  </button>
                )}
              </div>

              {/* Recipient info */}
              <div className="space-y-1 mb-4">
                <p className="font-display uppercase text-sm text-bone font-bold">
                  {addr.full_name}
                </p>
                <p className="font-sans text-xs text-steel leading-relaxed">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                  <br />
                  {addr.city}, {addr.state} - <span className="font-mono">{addr.pin}</span>
                </p>
                <p className="font-mono text-xs text-steel/80 pt-1 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-acid" /> +91 {addr.phone}
                </p>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-steel/15 flex items-center justify-end gap-3 text-xs font-mono uppercase">
                <button
                  type="button"
                  onClick={() => handleEdit(addr)}
                  className="text-steel hover:text-acid flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="text-steel hover:text-blood flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-ash border border-steel/40 w-full max-w-lg rounded-sm p-6 relative shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <FiligreeCorner position="top-right" size={20} variant="acid" />
            <FiligreeCorner position="bottom-left" size={20} variant="acid" />

            <div className="flex items-center justify-between border-b border-steel/20 pb-3">
              <h3 className="font-display uppercase text-base text-bone font-bold tracking-wider">
                {editingAddress ? "Edit Coordinates" : "Add Coordinates"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-steel hover:text-bone p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-blood/10 border border-blood text-blood text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-steel mb-1">
                    Label (e.g. Home, Studio)
                  </label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Home"
                    className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-steel mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Vikram Sharma"
                    className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-steel mb-1">
                  Indian Mobile Phone (10 Digits) *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono text-xs text-steel/60">+91</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full bg-void border border-steel/30 rounded-sm pl-12 pr-3 py-2 text-xs text-bone focus:border-acid focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-steel mb-1">
                  Address Line 1 (Street, Building, Flat) *
                </label>
                <input
                  type="text"
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Studio Flat 4B, Industrial Estate"
                  className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-steel mb-1">
                  Address Line 2 (Landmark, Sector - Optional)
                </label>
                <input
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Near Steel Foundry Gate 2"
                  className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-steel mb-1">
                    PIN Code (6 digits) *
                  </label>
                  <input
                    type="text"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    placeholder="400001"
                    maxLength={6}
                    className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-steel mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-steel mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    placeholder="Maharashtra"
                    className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-sans text-steel cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="accent-acid w-4 h-4 rounded"
                  />
                  <span>Make this my default shipping address for faster checkout</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-steel/20">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-mono uppercase text-steel hover:text-bone"
                >
                  Cancel
                </button>

                <ClawButton type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-void" />
                      <span>Saving...</span>
                    </span>
                  ) : (
                    <span>Save Address</span>
                  )}
                </ClawButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
