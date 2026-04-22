"use client";

import { useRef, useActionState, useSyncExternalStore } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Round {
  id: string;
  roundNumber: number;
}

interface BarcodeScannerProps {
  eventId: string;
  rounds: Round[];
  requireConfirmation?: boolean;
  allowDuplicates?: boolean;
  highThroughput?: boolean;
}

type ScanStatus = "idle" | "scanning" | "success" | "error";

interface ScannerState {
  status: ScanStatus;
  scannedValue: string | null;
  error: string | null;
  showConfirm: boolean;
  selectedRound: string;
}

// External store for scanner state (avoids useState/useEffect)
let scannerState: ScannerState = {
  status: "idle",
  scannedValue: null,
  error: null,
  showConfirm: false,
  selectedRound: "",
};
const listeners = new Set<() => void>();
let defaultRoundId: string | null = null;
const SUBMIT_THROTTLE_MS_DEFAULT = 2000;
const SUBMIT_THROTTLE_MS_FAST = 500;

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  // Lazy initialization of selectedRound
  if (!scannerState.selectedRound && defaultRoundId) {
    scannerState = { ...scannerState, selectedRound: defaultRoundId };
  }
  return scannerState;
}

function updateState(partial: Partial<ScannerState>) {
  scannerState = { ...scannerState, ...partial };
  listeners.forEach((l) => l());
}

function setDefaultRound(roundId: string) {
  defaultRoundId = roundId;
}

export function BarcodeScanner({
  eventId,
  rounds,
  requireConfirmation = false,
  allowDuplicates = true,
  highThroughput = false,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastSubmitTimeRef = useRef(0);
  const throttleMs = highThroughput
    ? SUBMIT_THROTTLE_MS_FAST
    : SUBMIT_THROTTLE_MS_DEFAULT;

  const isThrottled = () => Date.now() - lastSubmitTimeRef.current < throttleMs;

  // Set default round for lazy initialization (no state mutation here)
  if (rounds.length > 0 && !defaultRoundId) {
    setDefaultRound(rounds[rounds.length - 1].id);
  }

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const autoSubmit = async (value: string) => {
    if (isThrottled()) {
      // Resume scanner without submitting
      setTimeout(() => resumeScanner(), 100);
      return;
    }

    try {
      const response = await fetch("/api/barcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          roundId: scannerState.selectedRound || null,
          value,
          allowDuplicates,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        updateState({
          error: data.error || "Failed to submit barcode",
          status: "error",
        });
        return;
      }

      // eslint-disable-next-line react-hooks/purity -- Only called from event handlers, not during render
      lastSubmitTimeRef.current = Date.now();
      updateState({
        status: "idle",
        scannedValue: null,
        error: null,
        showConfirm: false,
      });

      setTimeout(() => resumeScanner(), 500);
    } catch {
      updateState({ error: "Failed to submit", status: "error" });
    }
  };

  const startScanner = async () => {
    if (scannerRef.current) return;

    try {
      const scanner = new Html5Qrcode("scanner-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: highThroughput ? 15 : 10,
          qrbox: { width: 350, height: 150 },
        },
        (decodedText) => {
          // Accept barcode immediately on first successful scan
          updateState({
            scannedValue: decodedText,
            showConfirm: requireConfirmation,
            status: "success",
          });
          scanner.pause(true);

          if (!requireConfirmation) {
            // Auto-submit without confirmation
            autoSubmit(decodedText);
          }
        },
        () => {
          // Ignore scan failures
        },
      );

      updateState({ status: "scanning" });
    } catch (err) {
      console.error("Scanner error:", err);
      updateState({
        error: "Failed to start camera. Please allow camera access.",
        status: "error",
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore errors when stopping
      }
      scannerRef.current = null;
    }
  };

  const resumeScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
        updateState({ status: "scanning" });
      } catch {
        stopScanner().then(startScanner);
      }
    }
  };

  // Ref callback to initialize scanner when DOM is ready
  const containerRefCallback = (node: HTMLDivElement | null) => {
    if (node && !scannerRef.current) {
      startScanner();
    }
  };

  const [submitState, submitAction, isSubmitting] = useActionState(
    async (
      _prev: { error: string | null },
      formData: FormData,
    ): Promise<{ error: string | null }> => {
      const value = formData.get("scannedValue") as string;
      const roundId = formData.get("roundId") as string;

      try {
        const response = await fetch("/api/barcodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            roundId: roundId || null,
            value,
            allowDuplicates,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          return { error: data.error || "Failed to submit barcode" };
        }

        updateState({
          status: "idle",
          scannedValue: null,
          error: null,
          showConfirm: false,
        });

        setTimeout(() => resumeScanner(), 500);
        return { error: null };
      } catch {
        return { error: "Failed to submit" };
      }
    },
    { error: null },
  );

  const handleCancel = () => {
    updateState({
      showConfirm: false,
      scannedValue: null,
      error: null,
    });
    resumeScanner();
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Round Selector */}
      {rounds.length > 0 && (
        <div className="bg-gray-800 px-4 py-3">
          <label className="text-sm text-gray-400 block mb-1">
            Current Round
          </label>
          <select
            value={state.selectedRound}
            onChange={(e) => updateState({ selectedRound: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
          >
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                Round {round.roundNumber}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner View */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        <div
          id="scanner-container"
          ref={containerRefCallback}
          className="absolute inset-0"
        />

        {/* Status Messages */}
        {state.status === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white">Initializing camera...</p>
          </div>
        )}

        {state.status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-4">
              <p className="text-red-400 mb-4">{state.error}</p>
              <button
                onClick={startScanner}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 px-4 py-3 text-center">
        <p className="text-gray-300 text-sm">Point camera at barcode to scan</p>
      </div>

      {/* Confirmation Modal */}
      {state.showConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form
            action={submitAction}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
          >
            <input
              type="hidden"
              name="scannedValue"
              value={state.scannedValue || ""}
            />
            <input type="hidden" name="roundId" value={state.selectedRound} />

            <div className="text-center mb-6">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Barcode Scanned
              </h2>
              <p className="font-mono text-2xl text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                {state.scannedValue}
              </p>
            </div>

            {submitState.error && (
              <p className="text-red-500 text-sm text-center mb-4">
                {submitState.error}
              </p>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
