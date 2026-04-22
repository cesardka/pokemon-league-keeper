"use client";

import { useState } from "react";
import { RoundFilter } from "./RoundFilter";
import { BarcodeList } from "./BarcodeList";
import { BarcodeQueuePlayer } from "./BarcodeQueuePlayer";

interface Round {
  id: string;
  roundNumber: number;
}

interface BarcodeItem {
  id: string;
  value: string;
  scannedAt: string;
  scannedBy: string;
  roundId: string | null;
}

interface ManagerEventViewProps {
  eventId: string;
  rounds: Round[];
  initialBarcodes: BarcodeItem[];
  isEventCompleted?: boolean;
}

type ViewMode = "queue" | "list";

export function ManagerEventView({
  eventId,
  rounds,
  initialBarcodes,
  isEventCompleted = false,
}: ManagerEventViewProps) {
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("queue");

  // Filter barcodes by selected round
  const filteredBarcodes = selectedRoundId
    ? initialBarcodes.filter((b) => b.roundId === selectedRoundId)
    : initialBarcodes;

  return (
    <div className="flex flex-col flex-1">
      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode("queue")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            viewMode === "queue"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Queue Player
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            viewMode === "list"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          List View
        </button>
      </div>

      {/* Round Filter */}
      <div className="mb-4">
        <RoundFilter
          eventId={eventId}
          rounds={rounds}
          selectedRoundId={selectedRoundId}
          onSelectRound={setSelectedRoundId}
          isEventCompleted={isEventCompleted}
          barcodes={initialBarcodes}
        />
      </div>

      {/* Content based on view mode */}
      {viewMode === "queue" ? (
        <BarcodeQueuePlayer barcodes={filteredBarcodes} eventId={eventId} />
      ) : (
        <BarcodeList
          eventId={eventId}
          initialBarcodes={initialBarcodes}
          selectedRoundId={selectedRoundId}
          isEventActive={!isEventCompleted}
        />
      )}
    </div>
  );
}
