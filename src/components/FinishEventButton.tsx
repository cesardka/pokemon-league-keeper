"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface FinishEventButtonProps {
  eventId: string;
  currentStatus: string;
  className?: string;
}

export function FinishEventButton({
  eventId,
  currentStatus,
  className = "",
}: FinishEventButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFinish = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (response.ok) {
        setShowConfirm(false);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      console.error("Failed to finish event:", error);
    }
  };

  const handleReactivate = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      if (response.ok) {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      console.error("Failed to reactivate event:", error);
    }
  };

  if (currentStatus === "COMPLETED") {
    return (
      <button
        onClick={handleReactivate}
        disabled={isPending}
        className={`flex items-center self-stretch px-3 text-sm font-medium text-green-200 hover:text-white hover:bg-green-600 disabled:opacity-50 transition-colors ${className}`}
      >
        {isPending ? "Reactivating..." : "Reactivate"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className={`flex items-center self-stretch px-4 text-sm font-medium text-blue-200 hover:text-white hover:bg-red-600 transition-colors ${className}`}
      >
        Finish <br /> Event
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4 flex justify-center">
                <Image
                  src="/icons/item_0547.png"
                  alt="Switch off item"
                  priority
                  width={200}
                  height={200}
                  className="w-24 h-24"
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Finish Event?
              </h2>
              <p className="text-gray-500">
                This will mark the event as completed.
                <br />
                You can reactivate it later if needed.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleFinish}
                disabled={isPending}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
              >
                {isPending ? "Finishing..." : "Finish Event"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
