"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { useToast } from "@/components/ui/toast";
import {
  Lock,
  Trash2,
  AlertTriangle,
  Check,
  Loader2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

export function AccountSecurity() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  // Change password states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete account states
  const [deleteInput, setDeleteInput] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Handle password update
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match. Please verify.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Security Updated", "Your password has been changed successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
      toast.error("Error", err.message || "Could not change password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (deleteInput.trim() !== "DELETE") {
      setDeleteError("You must type exactly DELETE to authorize account destruction.");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account.");
      }

      await supabase.auth.signOut();
      toast.info("Account Deleted", "Your collector profile and data have been removed.");
      window.location.href = "/";
    } catch (err: any) {
      setDeleteError(err.message || "An error occurred during account deletion.");
      toast.error("Deletion Error", err.message || "Could not delete account.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Change Password Section */}
      <div className="bg-ash/70 border border-steel/25 rounded-sm p-6 sm:p-7 relative backdrop-blur-md shadow-xl">
        <FiligreeCorner position="top-right" size={20} variant="acid" />

        <div className="flex items-center gap-2.5 border-b border-steel/20 pb-4 mb-5">
          <div className="w-8 h-8 rounded-sm bg-steel/10 border border-steel/30 text-bone flex items-center justify-center">
            <Lock className="w-4 h-4 text-acid" />
          </div>
          <div>
            <h3 className="font-display uppercase text-base text-bone font-bold tracking-wider">
              Security Credentials
            </h3>
            <p className="font-sans text-xs text-steel">
              Update the security password protecting your collector vault.
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="mb-4 p-3 bg-blood/10 border border-blood text-blood text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-mono uppercase text-steel mb-1">
              New Password (min 6 characters) *
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-void border border-steel/30 rounded-sm px-3.5 py-2.5 text-xs text-bone focus:border-acid focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-steel mb-1">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-void border border-steel/30 rounded-sm px-3.5 py-2.5 text-xs text-bone focus:border-acid focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <ClawButton
              type="submit"
              variant="secondary"
              size="sm"
              disabled={updatingPassword}
            >
              {updatingPassword ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-acid" />
                  <span>Update Password</span>
                </span>
              )}
            </ClawButton>
          </div>
        </form>
      </div>

      {/* 2. Danger Zone: Delete Account */}
      <div className="bg-blood/5 border border-blood/30 rounded-sm p-6 sm:p-7 relative backdrop-blur-md">
        <FiligreeCorner position="top-right" size={20} variant="blood" />

        <div className="flex items-center gap-2.5 border-b border-blood/20 pb-4 mb-4">
          <div className="w-8 h-8 rounded-sm bg-blood/10 border border-blood/40 text-blood flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-blood" />
          </div>
          <div>
            <h3 className="font-display uppercase text-base text-bone font-bold tracking-wider">
              Danger Zone
            </h3>
            <p className="font-sans text-xs text-steel">
              Irreversible account termination actions.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-sans text-xs text-steel leading-relaxed">
            Deleting your account will permanently purge your profile, saved addresses, and custom avatar.
            Orders you placed are strictly retained for tax and accounting records, but all links to your account are permanently severed (<code className="text-acid font-mono text-[11px]">user_id = null</code>).
          </p>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 border border-blood/50 bg-blood/10 hover:bg-blood/20 text-blood font-mono text-xs uppercase rounded transition-colors inline-flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete My Account</span>
          </button>
        </div>
      </div>

      {/* DELETION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-ash border border-blood/50 w-full max-w-md rounded-sm p-6 relative shadow-2xl space-y-4">
            <FiligreeCorner position="top-right" size={20} variant="blood" />
            <FiligreeCorner position="bottom-left" size={20} variant="blood" />

            <div className="flex items-center gap-3 text-blood">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-display uppercase text-lg font-bold">
                Confirm Account Destruction
              </h3>
            </div>

            <p className="font-sans text-xs text-steel leading-relaxed">
              This action cannot be undone. To permanently delete your collector account, please type <strong className="text-blood font-mono uppercase">DELETE</strong> below:
            </p>

            {deleteError && (
              <div className="p-3 bg-blood/15 border border-blood text-blood text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <input
                type="text"
                required
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full bg-void border border-blood/40 rounded-sm px-3.5 py-2.5 text-xs text-bone focus:border-blood focus:outline-none font-mono tracking-widest uppercase"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteInput("");
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 text-xs font-mono uppercase text-steel hover:text-bone"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={deleting || deleteInput.trim() !== "DELETE"}
                  className="px-4 py-2 bg-blood hover:bg-blood/90 text-bone text-xs font-mono uppercase rounded transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Permanently Destroy</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
