"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ModalContent = ReactNode | null;

interface ModalContextValue {
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModalContext() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModalContext must be used within ModalProvider");
  return ctx;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ModalContent>(null);

  const openModal = useCallback((node: ReactNode) => setContent(node), []);
  const closeModal = useCallback(() => setContent(null), []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {content}
    </ModalContext.Provider>
  );
}
