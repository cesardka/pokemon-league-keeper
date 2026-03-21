"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Round {
  id: string;
  roundNumber: number;
}

interface BarcodeItem {
  id: string;
  roundId: string | null;
}

interface RoundFilterProps {
  eventId: string;
  rounds: Round[];
  selectedRoundId: string | null;
  onSelectRound: (roundId: string | null) => void;
  isEventCompleted?: boolean;
  barcodes?: BarcodeItem[];
}

export function RoundFilter({
  eventId,
  rounds,
  selectedRoundId,
  onSelectRound,
  isEventCompleted = false,
  barcodes = [],
}: RoundFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);

  // Check if most recent round has any barcodes
  const mostRecentRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const mostRecentRoundHasBarcodes = mostRecentRound
    ? barcodes.some((b) => b.roundId === mostRecentRound.id)
    : true; // Allow if no rounds exist yet

  const handleCreateRound = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/events/${eventId}/rounds`, {
        method: "POST",
      });

      if (response.ok) {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      console.error("Failed to create round:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelectRound(null)}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          selectedRoundId === null
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        All
      </button>

      {rounds.map((round) => (
        <button
          key={round.id}
          onClick={() => onSelectRound(round.id)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            selectedRoundId === round.id
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Round {round.roundNumber}
        </button>
      ))}

      {!isEventCompleted && (
        <button
          onClick={handleCreateRound}
          disabled={isCreating || isPending || !mostRecentRoundHasBarcodes}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-500 flex items-center gap-1 ${
            mostRecentRoundHasBarcodes && !isCreating && !isPending
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <span>+</span>
          <span>{isCreating ? "Creating..." : "New Round"}</span>
        </button>
      )}
    </div>
  );
}
