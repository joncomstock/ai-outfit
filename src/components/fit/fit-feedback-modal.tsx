"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FitFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName: string;
  onSubmit: (feedback: { fit: string; notes: string }) => void;
}

const FIT_OPTIONS = [
  { value: "too_small", label: "Runs Small" },
  { value: "perfect", label: "True to Size" },
  { value: "too_large", label: "Runs Large" },
];

export function FitFeedbackModal({ isOpen, onClose, brandName, onSubmit }: FitFeedbackModalProps) {
  const [fit, setFit] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!fit) return;
    onSubmit({ fit, notes });
    setFit("");
    setNotes("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Fit Feedback — ${brandName}`} className="max-w-lg">
      <div className="flex flex-col gap-6">
        <p className="text-body-lg text-on-surface-variant">
          How does {brandName} fit compared to your usual size?
        </p>

        <div className="flex gap-3" role="radiogroup" aria-label="Fit assessment">
          {FIT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={fit === option.value}
              onClick={() => setFit(option.value)}
              className={`flex-1 py-3 text-body-md font-sans transition-colors duration-150 ${
                fit === option.value
                  ? "editorial-gradient text-on-primary"
                  : "ghost-border text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Input
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Shoulders are tight, consider sizing up"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!fit}>Save Feedback</Button>
        </div>
      </div>
    </Modal>
  );
}
