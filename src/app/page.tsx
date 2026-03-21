import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import Image from "next/image";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-linear-to-b from-blue-900 to-blue-950 px-4">
      <main className="flex flex-col items-center justify-center w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/illustrations/707-klefki.svg"
            alt="Klefki"
            width={180}
            height={180}
            loading="eager"
            className="mx-auto mb-4 animate-swing w-40 h-40"
          />
          <h1 className="text-3xl font-bold text-white mb-2">
            Pokemon TCG
          </h1>
          <p className="text-blue-200 text-lg">
            Tournament Manager
          </p>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Enter Event Code
          </h2>
          <LoginForm />
        </div>

        <p className="mt-6 text-blue-300 text-sm text-center">
          Enter the code provided by your tournament organizer
        </p>
      </main>
    </div>
  );
}
