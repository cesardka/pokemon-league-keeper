"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  const isHomepage = pathname === "/";
  const isJudgePage = pathname === "/slips";

  return (
    <footer
      className={`py-4 text-center text-sm ${
        isJudgePage
          ? "bg-green-600 text-green-200"
          : isHomepage
            ? "bg-blue-950 text-blue-200"
            : "bg-gray-50 text-gray-500"
      }`}
    >
      Pokémon League Keeper © {new Date().getFullYear()} César Hoffmann
    </footer>
  );
}
