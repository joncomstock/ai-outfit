"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const milestoneContent = {
  first_upload: {
    title: "First Item Uploaded!",
    description:
      "Your digital closet has its first piece. Our AI is analyzing it now.",
    cta: "View Closet",
    href: "/closet",
  },
  first_processed: {
    title: "AI Analysis Complete!",
    description:
      "Your first item has been analyzed. Upload more to unlock outfit generation.",
    cta: "Upload More",
    href: "/closet",
  },
  first_outfit: {
    title: "Your First Outfit!",
    description:
      "Your AI stylist just created a look. Rate it to improve future recommendations.",
    cta: "View Outfit",
    href: "/outfits",
  },
};

export function MilestoneCelebration({ milestone }: { milestone: string }) {
  const [dismissed, setDismissed] = useState(false);
  const content = milestoneContent[milestone as keyof typeof milestoneContent];
  if (!content || dismissed) return null;
  return (
    <Modal
      isOpen={true}
      onClose={() => setDismissed(true)}
      title={content.title}
      className="max-w-md"
    >
      <p className="text-body-lg text-on-surface-variant mb-8">
        {content.description}
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
        <Link href={content.href}>
          <Button>{content.cta}</Button>
        </Link>
      </div>
    </Modal>
  );
}
