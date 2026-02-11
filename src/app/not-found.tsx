import Link from 'next/link';

import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-3xl w-full text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <svg
            width="44"
            height="44"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="28" fill="#E2E8F0" />
            <circle cx="24" cy="28" r="3" fill="#94A3B8" />
            <circle cx="40" cy="28" r="3" fill="#94A3B8" />
            <path
              d="M22 42C24.5 38.5 27.8 36.8 32 36.8C36.2 36.8 39.5 38.5 42 42"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          We couldn’t find what you’re looking for
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600">
          The page may be missing, or the content is no longer available. Try
          going back or explore other sections.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">Go to homepage</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact-us">Contact support</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
