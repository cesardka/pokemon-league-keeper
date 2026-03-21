"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function CreateEventForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Event name is required");
      return;
    }

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create event");
        return;
      }

      const data = await response.json();
      setName("");
      setIsOpen(false);

      startTransition(() => {
        router.push(`/manager/${data.event.id}`);
        router.refresh();
      });
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-xl">+</span>
        <span>Create New Event</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl p-4 shadow-sm border border-blue-200"
    >
      <h3 className="font-medium text-gray-900 mb-3">New Event</h3>

      <div className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Event name (e.g., Weekly Tournament)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800"
          autoFocus
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
          >
            {isPending ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setName("");
              setError(null);
            }}
            disabled={isPending}
            className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
