import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BackButton } from "@/components/BackButton";
import { JudgeNameForm } from "@/components/JudgeNameForm";

export default async function JudgeEntryPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (session.judgeName) {
    redirect("/judge/select");
  }

  return (
    <div className="flex flex-col flex-1 bg-green-600">
      <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto">
        <BackButton
          href="/dashboard"
          variant="green"
          className="py-4 justify-start hover:bg-green-500"
        />

        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              <Image
                src="/illustrations/350-milotic-pikachu.svg"
                alt="Milotic with Pikachu"
                priority
                width={300}
                height={300}
                className="w-64 h-64 animate-swing"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 text-shadow-lg">
              Floor Judge
            </h1>
            <p className="text-green-100">Enter your name to start scanning</p>
          </div>

          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <JudgeNameForm />
          </div>
        </main>
      </div>
    </div>
  );
}
