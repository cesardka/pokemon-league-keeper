import Link from "next/link";

interface BackButtonProps {
  href: string;
  variant?: "blue" | "green";
}

const variantStyles = {
  blue: "text-blue-200 hover:text-white hover:bg-blue-700",
  green: "text-green-200 hover:text-white hover:bg-green-700",
};

export function BackButton({ href, variant = "blue" }: BackButtonProps) {
  return (
    <Link
      href={href}
      className={`flex items-center self-stretch px-3 ml-0 transition-colors ${variantStyles[variant]}`}
    >
      ← Back
    </Link>
  );
}
