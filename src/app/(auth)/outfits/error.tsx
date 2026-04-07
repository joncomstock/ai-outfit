"use client";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 text-center"
      role="alert"
    >
      <h2 className="font-serif text-headline-md text-on-surface mb-3">
        Something went wrong
      </h2>
      <p className="text-body-lg text-on-surface-variant max-w-md mb-8">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
