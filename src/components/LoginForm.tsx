"use client";

import { useRef, useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type FormState = { error: string | null; code: string[]; success?: boolean };

const CODE_LENGTH = 4;

export function LoginForm() {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [showTransition, setShowTransition] = useState(false);

  const checkAndSubmit = () => {
    const allFilled = inputRefs.current.every((input) => input?.value.length === 1);
    if (allFilled && formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const [state, formAction, isPending] = useActionState(
    async (_prevState: FormState, formData: FormData): Promise<FormState> => {
      const digits = Array.from({ length: CODE_LENGTH }, (_, i) =>
        formData.get(`digit-${i}`) as string
      );
      const code = digits.join("");

      if (code.length !== CODE_LENGTH) {
        return { error: "Please enter all 4 digits", code: digits };
      }

      try {
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventCode: code }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { error: data.error || "Invalid event code", code: digits };
        }

        return { error: null, code: [], success: true };
      } catch {
        return { error: "Something went wrong. Please try again.", code: digits };
      }
    },
    { error: null, code: [] }
  );

  // Handle success animation and redirect
  if (state.success && !showTransition) {
    setShowTransition(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  const handleInput = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) {
      const input = inputRefs.current[index];
      if (input) input.value = value.slice(-1);
    }

    // Auto-focus next input
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all inputs are filled
    if (value) {
      setTimeout(checkAndSubmit, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - go to previous input
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, CODE_LENGTH);

    pastedData.split("").forEach((char, i) => {
      const input = inputRefs.current[i];
      if (input) input.value = char;
    });

    // Focus the next empty input or last input
    const nextEmptyIndex = pastedData.length < CODE_LENGTH ? pastedData.length : CODE_LENGTH - 1;
    inputRefs.current[nextEmptyIndex]?.focus();

    // Auto-submit if all inputs are filled after paste
    if (pastedData.length >= CODE_LENGTH) {
      setTimeout(checkAndSubmit, 0);
    }
  };

  return (
    <>
      {showTransition && (
        <>
          <div className="fixed inset-0 z-40 overflow-hidden pointer-events-none">
            <div 
              className="absolute top-1/2 left-1/2 w-[300vmax] h-[300vmax] rounded-full bg-white"
              style={{ animation: 'circle-expand 3s ease-in-out forwards' }}
            />
          </div>
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-none">
            <Image
              src="/illustrations/279-pelipper-pikachu.svg"
              alt="Pelipper delivering Pikachu"
              priority
              width={200}
              height={200}
              className="animate-pelipper-fly w-48 h-48"
            />
          </div>
        </>
      )}
      <form ref={formRef} action={formAction} className="space-y-4">
      <div className="flex justify-center gap-3">
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            name={`digit-${i}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            defaultValue={state.code[i] || ""}
            autoFocus={i === 0}
            autoComplete="off"
            onInput={(e) => handleInput(i, e.currentTarget.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="w-14 h-16 text-center text-2xl font-mono font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-gray-700"
            required
          />
        ))}
      </div>

      {state.error && (
        <p className="text-red-500 text-sm text-center">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
      >
        {isPending ? "Verifying..." : "Enter"}
      </button>
    </form>
    </>
  );
}
