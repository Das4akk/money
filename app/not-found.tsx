import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold text-amber-400 mb-2">404</h1>
      <p className="text-zinc-400 mb-6 text-sm">Страница не найдена</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition-all"
      >
        Вернуться в FORM STUDIO
      </Link>
    </div>
  );
}
