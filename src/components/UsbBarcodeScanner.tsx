"use client";

import { useRef, useEffect, useActionState, useSyncExternalStore } from "react";

interface Round {
  id: string;
  roundNumber: number;
}

interface UsbBarcodeScannerProps {
  eventId: string;
  rounds: Round[];
}

type ScanStatus = "idle" | "ready" | "success" | "error";

interface ScannerState {
  status: ScanStatus;
  scannedValue: string | null;
  error: string | null;
  showConfirm: boolean;
  selectedRound: string;
  mockMode: boolean;
  mockInput: string;
}

// External store for scanner state
let usbScannerState: ScannerState = {
  status: "idle",
  scannedValue: null,
  error: null,
  showConfirm: false,
  selectedRound: "",
  mockMode: false,
  mockInput: "",
};
const usbListeners = new Set<() => void>();
let usbDefaultRoundId: string | null = null;

function subscribe(callback: () => void) {
  usbListeners.add(callback);
  return () => usbListeners.delete(callback);
}

function getSnapshot() {
  if (!usbScannerState.selectedRound && usbDefaultRoundId) {
    usbScannerState = { ...usbScannerState, selectedRound: usbDefaultRoundId };
  }
  return usbScannerState;
}

function updateState(partial: Partial<ScannerState>) {
  usbScannerState = { ...usbScannerState, ...partial };
  usbListeners.forEach((l) => l());
}

function setDefaultRound(roundId: string) {
  usbDefaultRoundId = roundId;
}

// Reset state when component mounts
function resetState() {
  usbScannerState = {
    status: "ready",
    scannedValue: null,
    error: null,
    showConfirm: false,
    selectedRound: usbDefaultRoundId || "",
    mockMode: false,
    mockInput: "",
  };
  usbListeners.forEach((l) => l());
}

export function UsbBarcodeScanner({ eventId, rounds }: UsbBarcodeScannerProps) {
  const inputBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // USB scanners typically send characters very fast (< 50ms between chars)
  const SCAN_THRESHOLD_MS = 100;
  const MIN_BARCODE_LENGTH = 3;

  // Set default round for lazy initialization
  if (rounds.length > 0 && !usbDefaultRoundId) {
    setDefaultRound(rounds[rounds.length - 1].id);
  }

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Initialize state on mount
  useEffect(() => {
    resetState();
  }, []);

  // Handle keyboard input from USB scanner
  useEffect(() => {
    if (state.showConfirm || state.mockMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;

      // If Enter is pressed and we have buffered input
      if (e.key === "Enter") {
        if (inputBufferRef.current.length >= MIN_BARCODE_LENGTH) {
          e.preventDefault();
          updateState({
            scannedValue: inputBufferRef.current,
            showConfirm: true,
            status: "success",
          });
        }
        inputBufferRef.current = "";
        lastKeyTimeRef.current = 0;
        return;
      }

      // Only capture printable characters
      if (e.key.length === 1) {
        // If too much time has passed, reset buffer
        if (timeDiff > SCAN_THRESHOLD_MS && inputBufferRef.current.length > 0) {
          inputBufferRef.current = "";
        }
        
        inputBufferRef.current += e.key;
        lastKeyTimeRef.current = now;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.showConfirm, state.mockMode]);

  // Focus management for accessibility
  useEffect(() => {
    if (!state.showConfirm && !state.mockMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.showConfirm, state.mockMode]);

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
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          return { error: data.error || "Failed to submit barcode" };
        }

        updateState({
          status: "ready",
          scannedValue: null,
          error: null,
          showConfirm: false,
        });

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
  };

  const handleMockSubmit = () => {
    if (state.mockInput.trim().length >= MIN_BARCODE_LENGTH) {
      updateState({
        scannedValue: state.mockInput.trim(),
        showConfirm: true,
        status: "success",
        mockMode: false,
        mockInput: "",
      });
    }
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

      {/* USB Scanner View */}
      <div className="flex-1 relative bg-gray-900 flex flex-col items-center justify-center p-8">
        {/* Hidden input to capture focus for USB scanner */}
        <input
          ref={inputRef}
          type="text"
          className="sr-only"
          aria-label="USB barcode scanner input"
          onBlur={(e) => {
            // Re-focus unless modal is open or mock mode
            if (!state.showConfirm && !state.mockMode) {
              setTimeout(() => e.target.focus(), 100);
            }
          }}
        />

        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              USB Scanner Ready
            </h2>
            <p className="text-gray-400">
              Scan a barcode with your USB scanner device
            </p>
          </div>

          {state.status === "ready" && (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm">Listening for input...</span>
            </div>
          )}
        </div>
      </div>

      {/* Mock Testing Panel */}
      <div className="bg-gray-800 px-4 py-3">
        {!state.mockMode ? (
          <button
            onClick={() => updateState({ mockMode: true })}
            className="w-full py-2 text-sm text-gray-400 hover:text-white border border-dashed border-gray-600 hover:border-gray-400 rounded-lg transition-colors"
          >
            🧪 Test Mode: Enter barcode manually
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={state.mockInput}
                onChange={(e) => updateState({ mockInput: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleMockSubmit();
                  } else if (e.key === "Escape") {
                    updateState({ mockMode: false, mockInput: "" });
                  }
                }}
                placeholder="Enter barcode value..."
                autoFocus
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleMockSubmit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Scan
              </button>
            </div>
            <button
              onClick={() => updateState({ mockMode: false, mockInput: "" })}
              className="w-full py-1 text-xs text-gray-500 hover:text-gray-300"
            >
              Cancel test mode
            </button>
          </div>
        )}
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
