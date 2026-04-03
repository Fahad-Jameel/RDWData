"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (error: unknown) => void;
      }) => {
        render: (selectorOrElement: string | HTMLElement) => Promise<void>;
        close: () => void;
      };
    };
  }
}

type Props = {
  plate: string;
  amount?: string;
  currency?: string;
  onSuccess: () => void;
  onError: (message: string) => void;
};

const SCRIPT_ID = "paypal-js-sdk";

function loadPaypalScript(clientId: string, currency: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load PayPal SDK.")));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load PayPal SDK."));
    document.body.appendChild(script);
  });
}

export function PayPalCheckout({
  plate,
  amount = "9.95",
  currency = "EUR",
  onSuccess,
  onError
}: Props) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
    if (!clientId) {
      onError("Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID.");
      return;
    }

    let active = true;
    loadPaypalScript(clientId, currency)
      .then(() => {
        if (active) setReady(true);
      })
      .catch((err) => {
        onError(err instanceof Error ? err.message : "PayPal SDK failed to load.");
      });

    return () => {
      active = false;
    };
  }, [currency, onError]);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.paypal || renderedRef.current) return;
    renderedRef.current = true;

    const buttons = window.paypal.Buttons({
      createOrder: async () => {
        const response = await fetch("/api/payments/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plate, amount, currency })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Unable to create PayPal order.");
        }

        const order = (await response.json()) as { id?: string };
        if (!order.id) throw new Error("PayPal order id missing.");
        return order.id;
      },
      onApprove: async ({ orderID }) => {
        const response = await fetch("/api/payments/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderID, plate })
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? "Unable to capture payment.");
        }

        onSuccess();
      },
      onError: (error) => {
        onError(error instanceof Error ? error.message : "PayPal checkout failed.");
      }
    });

    void buttons.render(containerRef.current);

    return () => {
      try {
        buttons.close();
      } catch {
        // no-op
      }
    };
  }, [ready, plate, amount, currency, onSuccess, onError]);

  return <div ref={containerRef} />;
}

