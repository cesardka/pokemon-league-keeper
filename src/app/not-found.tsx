import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="relative flex flex-col flex-1 bg-gray-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-5 pointer-events-none"
        style={{ backgroundImage: "url('/bg/Pokemon_RBY_Vermilion_Gym.png')" }}
      />
      <div className="relative flex flex-col flex-1 w-full max-w-2xl mx-auto items-center justify-center px-4">
        <div className="text-center">
          <h1
            className="text-sm sm:text-base md:text-xl leading-loose aspect-[2.56] flex items-center justify-center font-bold text-justify text-gray-900 mb-4 px-4 sm:px-12 md:px-20 md:-mt-12 my-4 bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/bg/pokemon-rby-text-box-shorter.png')",
              fontFamily: "Pokemon",
            }}
          >
            Nope! There&apos;s <br /> only trash here.
          </h1>

          <p className="text-gray-500 mb-8 text-lg font-medium">
            The page you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>

          <div className="mb-8">
            <Image
              src="/illustrations/568-trubbish.svg"
              alt="Trubbish"
              loading="eager"
              width={450}
              height={450}
              className="mx-auto w-auto h-auto"
            />
          </div>

          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
