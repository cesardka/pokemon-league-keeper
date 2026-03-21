"use client";

import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className = "" }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center self-stretch px-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${className}`}
    >
      Logout
    </button>
  );
}
