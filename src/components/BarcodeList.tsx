"use client";

import Image from "next/image";
import { useSyncExternalStore, useState } from "react";
import Barcode from "react-barcode";

interface BarcodeItem {
  id: string;
  value: string;
  scannedAt: string;
  scannedBy: string;
  roundId: string | null;
  isNew?: boolean;
}

interface BarcodeListProps {
  eventId: string;
  initialBarcodes: BarcodeItem[];
  selectedRoundId?: string | null;
  isEventActive?: boolean;
}

interface BarcodeStore {
  barcodes: BarcodeItem[];
  eventId: string;
  tick: number;
}

// External store for barcode state
let store: BarcodeStore | null = null;
const listeners = new Set<() => void>();

function initStore(eventId: string, initialBarcodes: BarcodeItem[]) {
  if (!store || store.eventId !== eventId) {
    store = {
      barcodes: initialBarcodes,
      eventId,
      tick: 0,
    };
  }
}
let pollingInterval: ReturnType<typeof setInterval> | null = null;
let tickInterval: ReturnType<typeof setInterval> | null = null;

function notifyListeners() {
  listeners.forEach((l) => l());
}

let shouldPoll = true;

function setPollingEnabled(enabled: boolean) {
  shouldPoll = enabled;
  if (enabled && listeners.size > 0) {
    startPolling();
  } else if (!enabled) {
    stopPolling();
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  // Start polling when first listener subscribes (only if polling enabled)
  if (listeners.size === 1) {
    if (shouldPoll) {
      startPolling();
    }
    startTickUpdates();
  }

  return () => {
    listeners.delete(callback);
    // Stop polling when last listener unsubscribes
    if (listeners.size === 0) {
      stopPolling();
      stopTickUpdates();
    }
  };
}

function getSnapshot() {
  return store;
}

async function fetchBarcodes() {
  if (!store) return;
  try {
    const lastBarcode = store.barcodes[0];
    const since = lastBarcode?.scannedAt || new Date(0).toISOString();

    const response = await fetch(
      `/api/events/${store.eventId}/barcodes?since=${encodeURIComponent(since)}`,
    );

    if (!response.ok) return;

    const newBarcodes: BarcodeItem[] = await response.json();

    if (newBarcodes.length > 0) {
      const existingIds = new Set(store.barcodes.map((b) => b.id));
      const uniqueNew = newBarcodes
        .filter((b) => !existingIds.has(b.id))
        .map((b) => ({ ...b, isNew: true }));

      if (uniqueNew.length > 0) {
        store = {
          ...store,
          barcodes: [...uniqueNew, ...store.barcodes],
        };
        notifyListeners();

        // Remove isNew flag after animation
        setTimeout(() => {
          if (!store) return;
          store = {
            ...store,
            barcodes: store.barcodes.map((b) => ({ ...b, isNew: false })),
          };
          notifyListeners();
        }, 2000);
      }
    }
  } catch (error) {
    console.error("Failed to fetch barcodes:", error);
  }
}

function startPolling() {
  if (!pollingInterval) {
    pollingInterval = setInterval(fetchBarcodes, 2000);
  }
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

function startTickUpdates() {
  if (!tickInterval) {
    tickInterval = setInterval(() => {
      if (!store) return;
      store = { ...store, tick: store.tick + 1 };
      notifyListeners();
    }, 1000);
  }
}

function stopTickUpdates() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function BarcodeCard({ barcode }: { barcode: BarcodeItem }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(barcode.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-white rounded-xl p-3 shadow-sm border transition-all duration-500 ${
        barcode.isNew
          ? "border-green-400 bg-green-50 animate-pulse"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className={`flex-shrink-0 p-4 rounded-lg transition-colors ${
            copied
              ? "bg-green-100 text-green-600"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          }`}
          title="Copy barcode value"
        >
          {copied ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>

        <div className="flex-1 overflow-hidden flex justify-center">
          <Barcode
            value={barcode.value}
            height={80}
            width={2}
            fontSize={12}
            margin={0}
            background="transparent"
          />
        </div>

        <div className="text-right shrink-0 self-end">
          <p
            className={`text-xs font-medium ${
              barcode.isNew ? "text-green-600" : "text-gray-400"
            }`}
          >
            {formatRelativeTime(barcode.scannedAt)}
          </p>
          <p className="text-xs text-gray-400">{barcode.scannedBy}</p>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const scannedAt = new Date(dateString).getTime();
  const diffSeconds = Math.floor((now - scannedAt) / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  return `${diffHours}h ${remainingMinutes}m ago`;
}

export function BarcodeList({
  eventId,
  initialBarcodes,
  selectedRoundId,
  isEventActive = true,
}: BarcodeListProps) {
  // Initialize store before subscribing
  initStore(eventId, initialBarcodes);

  // Control polling based on event status
  setPollingEnabled(isEventActive);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Filter barcodes by selected round
  const filteredBarcodes = selectedRoundId
    ? state?.barcodes.filter((b) => b.roundId === selectedRoundId) ?? []
    : state?.barcodes ?? [];

  if (filteredBarcodes.length === 0) {
    return (
      <div className="text-center py-12">
        <Image
          src="/illustrations/100-voltorb.svg"
          alt="Voltorb"
          loading="eager"
          width={200}
          height={200}
          className="mx-auto mb-8 object-contain animate-swing"
        />
        <p className="text-gray-500">
          {selectedRoundId
            ? "No barcodes scanned for this round yet"
            : "Waiting for scanned barcodes..."}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Barcodes will appear here as judges scan them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 mb-4">
        {filteredBarcodes.length} barcode
        {filteredBarcodes.length !== 1 ? "s" : ""} scanned
        {selectedRoundId ? " in this round" : ""}
      </p>

      {filteredBarcodes.map((barcode) => (
        <BarcodeCard key={barcode.id} barcode={barcode} />
      ))}
    </div>
  );
}
