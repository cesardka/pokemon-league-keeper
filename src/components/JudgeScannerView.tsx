"use client";

import { useState } from "react";
import { BarcodeScanner } from "./BarcodeScanner";
import { UsbBarcodeScanner } from "./UsbBarcodeScanner";
import { BackButton } from "./BackButton";

interface Round {
  id: string;
  roundNumber: number;
}

interface JudgeScannerViewProps {
  eventId: string;
  eventName: string;
  judgeName: string;
  rounds: Round[];
}

type ScannerMode = "camera" | "usb";

const SCANNER_MODE_KEY = "preferred-scanner-mode";

function getInitialMode(): { mode: ScannerMode | null; showSelector: boolean } {
  if (typeof window === "undefined") {
    return { mode: null, showSelector: true };
  }
  const savedMode = localStorage.getItem(
    SCANNER_MODE_KEY,
  ) as ScannerMode | null;
  if (savedMode === "camera" || savedMode === "usb") {
    return { mode: savedMode, showSelector: false };
  }
  return { mode: null, showSelector: true };
}

export function JudgeScannerView({
  eventId,
  eventName,
  judgeName,
  rounds,
}: JudgeScannerViewProps) {
  const [{ mode, showSelector }, setState] = useState(getInitialMode);

  const selectMode = (selectedMode: ScannerMode, remember: boolean) => {
    setState({ mode: selectedMode, showSelector: false });
    if (remember) {
      localStorage.setItem(SCANNER_MODE_KEY, selectedMode);
    }
  };

  const switchMode = () => {
    setState({ mode: null, showSelector: true });
    localStorage.removeItem(SCANNER_MODE_KEY);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-green-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-stretch gap-3">
            <BackButton href="/slips/select" variant="green" />
            <div className="py-3">
              <h1 className="font-semibold">{eventName}</h1>
              <p className="text-sm text-green-200">{judgeName}</p>
            </div>
          </div>

          {/* Scanner Mode Toggle - only show when not in selector screen */}
          {!showSelector && (
            <button
              onClick={switchMode}
              className="flex items-center self-stretch px-3 text-sm text-green-200 hover:text-white hover:bg-green-700 transition-colors"
              title={`Switch from ${mode === "camera" ? "Camera" : "USB"} scanner`}
            >
              {mode === "camera" ? (
                <svg
                  className="w-6 h-6 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 mr-1"
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
              )}
              <span className="ml-2 text-left leading-tight">
                Toggle
                <br />
                Capture
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {showSelector ? (
          <ScannerModeSelector onSelect={selectMode} />
        ) : mode === "camera" ? (
          <BarcodeScanner
            eventId={eventId}
            rounds={rounds}
            highThroughput
            allowDuplicates
          />
        ) : (
          <UsbBarcodeScanner
            eventId={eventId}
            rounds={rounds}
            highThroughput
            allowDuplicates
          />
        )}
      </main>
    </>
  );
}

// Mode selection screen component
function ScannerModeSelector({
  onSelect,
}: {
  onSelect: (mode: ScannerMode, remember: boolean) => void;
}) {
  return (
    <div className="flex flex-col flex-1 bg-gray-900">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          Select Scanner Device
        </h2>
        <p className="text-gray-400 text-sm mb-8 text-center">
          Choose how you want to scan barcodes
        </p>

        <div className="grid gap-4 w-full max-w-sm">
          {/* Camera Option */}
          <button
            onClick={() => onSelect("camera", false)}
            className="flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 hover:border-green-500 transition-all group"
          >
            <div className="w-14 h-14 bg-gray-700 group-hover:bg-green-600/20 rounded-full flex items-center justify-center transition-colors">
              <svg
                className="w-7 h-7 text-gray-400 group-hover:text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-white">Camera</h3>
              <p className="text-sm text-gray-400">Use device camera to scan</p>
            </div>
            <svg
              className="w-5 h-5 text-gray-500 group-hover:text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* USB Scanner Option */}
          <button
            onClick={() => onSelect("usb", false)}
            className="flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 hover:border-green-500 transition-all group"
          >
            <div className="w-14 h-14 bg-gray-700 group-hover:bg-green-600/20 rounded-full flex items-center justify-center transition-colors">
              <svg
                className="w-7 h-7 text-gray-400 group-hover:text-green-500"
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
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-white">USB Scanner</h3>
              <p className="text-sm text-gray-400">External barcode scanner</p>
            </div>
            <svg
              className="w-5 h-5 text-gray-500 group-hover:text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6 text-center">
          You can change this later by tapping the icon in the header
        </p>
      </div>
    </div>
  );
}
