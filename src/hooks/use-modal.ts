"use client";

import { useModalContext } from "@/components/layout/modal-provider";

export function useModal() {
  return useModalContext();
}
