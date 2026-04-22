"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Barcode from "react-barcode";

interface BarcodeItem {
  id: string;
  value: string;
  scannedAt: string;
  scannedBy: string;
  roundId: string | null;
}

interface BarcodeQueuePlayerProps {
  barcodes: BarcodeItem[];
  eventId: string;
}

const SPEED_STORAGE_KEY = "queue-speed-bpm";
const DEFAULT_SPEED = 120; // barcodes per minute
const MIN_SPEED = 30;
const MAX_SPEED = 1000;

export function BarcodeQueuePlayer({
  barcodes,
  eventId,
}: BarcodeQueuePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const hasHydratedSpeed = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate speed from localStorage after mount to avoid SSR/CSR mismatch
  useEffect(() => {
    const saved = localStorage.getItem(SPEED_STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed)) {
        setSpeed(parsed);
      }
    }
    hasHydratedSpeed.current = true;
  }, []);

  // Persist speed to localStorage (skip the initial default before hydration)
  useEffect(() => {
    if (!hasHydratedSpeed.current) return;
    localStorage.setItem(SPEED_STORAGE_KEY, speed.toString());
  }, [speed]);

  // Calculate interval from speed (barcodes per minute)
  const getIntervalMs = useCallback(() => {
    return Math.round(60000 / speed);
  }, [speed]);

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying && barcodes.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= barcodes.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, getIntervalMs());
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, barcodes.length, getIntervalMs]);

  const handlePlay = () => setIsPlaying(true);
  const handleStop = () => setIsPlaying(false);
  const handleRewind = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 10));
  };
  const handleBackToStart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };
  const handleForward = () => {
    setCurrentIndex((prev) => Math.min(barcodes.length - 1, prev + 10));
  };
  const handleSpeedChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setSpeed(Math.min(MAX_SPEED, Math.max(MIN_SPEED, value)));
  };

  const currentBarcode = barcodes[currentIndex];

  if (barcodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
        <p className="text-gray-500 text-lg">No barcodes to display</p>
        <p className="text-sm text-gray-400 mt-2">
          Barcodes will appear here once scanned
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Current Barcode Display */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg p-8 mb-4">
        {currentBarcode && (
          <>
            <div className="mb-4">
              <Barcode
                value={currentBarcode.value}
                height={120}
                width={3}
                fontSize={20}
                margin={10}
                background="#ffffff"
              />
            </div>
            <p className="text-sm text-gray-500">
              Scanned by {currentBarcode.scannedBy}
            </p>
          </>
        )}
      </div>

      {/* Sticky compact control bar */}
      <div className="sticky bottom-0 -mx-4 px-4 pb-[env(safe-area-inset-bottom)] z-10">
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Progress bar (clickable strip on top) */}
          <div
            className="h-1.5 bg-gray-200 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              setCurrentIndex(
                Math.min(
                  barcodes.length - 1,
                  Math.max(0, Math.round(pct * (barcodes.length - 1))),
                ),
              );
            }}
            title="Seek"
          >
            <div
              className="h-full bg-blue-600 transition-all duration-150"
              style={{
                width: `${((currentIndex + 1) / barcodes.length) * 100}%`,
              }}
            />
          </div>

          {/* Single row: playback | counter | speed */}
          <div className="flex items-center gap-2 px-3 py-2">
            {/* Playback */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleBackToStart}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Reset to first barcode"
                aria-label="Reset to first barcode"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v5h5" />
                </svg>
              </button>
              <button
                onClick={handleRewind}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Rewind 10"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                </svg>
              </button>
              {isPlaying ? (
                <button
                  onClick={handleStop}
                  className="p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                  title="Stop"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 6h12v12H6z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handlePlay}
                  className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  title="Play"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleForward}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Forward 10"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentIndex(barcodes.length - 1)}
                className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Skip to End"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>

            {/* Counter */}
            <div className="text-xs text-gray-500 tabular-nums shrink-0">
              {currentIndex + 1}/{barcodes.length}
            </div>

            {/* Speed control (slider + number) */}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <input
                type="range"
                min={MIN_SPEED}
                max={MAX_SPEED}
                step={10}
                value={speed}
                onChange={(e) =>
                  handleSpeedChange(parseInt(e.target.value, 10))
                }
                onInput={(e) =>
                  handleSpeedChange(
                    parseInt((e.target as HTMLInputElement).value, 10),
                  )
                }
                className="flex-1 min-w-0 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                title={`Speed: ${speed} bpm`}
              />
              <input
                id="queue-speed-input"
                type="number"
                inputMode="numeric"
                min={MIN_SPEED}
                max={MAX_SPEED}
                value={speed}
                onChange={(e) =>
                  handleSpeedChange(parseInt(e.target.value, 10))
                }
                className="w-14 px-1.5 py-1 text-xs text-right text-gray-800 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0"
              />
              <span className="text-[10px] text-gray-500 shrink-0">bpm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
