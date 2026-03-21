"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

type FormState = { error: string | null };

export function JudgeNameForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (_prevState: FormState, formData: FormData): Promise<FormState> => {
      const name = (formData.get("judgeName") as string)?.trim();

      if (!name) {
        return { error: "Name is required" };
      }

      try {
        const response = await fetch("/api/auth/judge-name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ judgeName: name }),
        });

        if (!response.ok) {
          const data = await response.json();
          return { error: data.error || "Failed to set name" };
        }

        router.push("/judge/select");
        router.refresh();
        return { error: null };
      } catch {
        return { error: "Something went wrong. Please try again." };
      }
    },
    { error: null }
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="judgeName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Your Name
        </label>
        <input
          id="judgeName"
          name="judgeName"
          type="text"
          placeholder="e.g., John Smith"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors text-gray-800"
          required
          autoFocus
        />
      </div>

      {state.error && (
        <p className="text-red-500 text-sm text-center">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
      >
        {isPending ? "Setting up..." : "Continue"}
      </button>
    </form>
  );
}
