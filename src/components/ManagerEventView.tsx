"use client";

import { useState } from "react";
import { RoundFilter } from "./RoundFilter";
import { BarcodeList } from "./BarcodeList";

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

export function ManagerEventView({
  eventId,
  rounds,
  initialBarcodes,
  isEventCompleted = false,
}: ManagerEventViewProps) {
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);

  return (
    <>
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

      <BarcodeList
        eventId={eventId}
        initialBarcodes={initialBarcodes}
        selectedRoundId={selectedRoundId}
        isEventActive={!isEventCompleted}
      />
    </>
  );
}
