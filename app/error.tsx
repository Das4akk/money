'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xl font-bold text-rose-400 mb-2">Произошла ошибка</h2>
      <p className="text-zinc-400 mb-6 text-xs max-w-md">{error.message || 'Непредвиденный сбой приложения'}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all"
      >
        Попробовать снова
      </button>
    </div>
  );
}
