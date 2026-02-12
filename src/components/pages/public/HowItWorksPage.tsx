const HowItWorksPage = () => {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-linear-to-br from-green-50 via-emerald-50 to-white" />
        <div className="container mx-auto relative py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              How it works
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              Book trusted home services and shop essentials in one place
            </h1>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              Rute connects you with vetted professionals and reliable products
              so your home stays safe, clean, and running smoothly. Choose a
              service, pick a time, and track everything from one account.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-14 md:py-18">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-green-100 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              For home services
            </h2>
            <ol className="mt-6 space-y-5">
              <li className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Choose a service
                  </h3>
                  <p className="text-sm text-slate-600">
                    Browse cleaning, plumbing, electrical, repairs, and more
                    based on your location.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Get transparent pricing
                  </h3>
                  <p className="text-sm text-slate-600">
                    View clear quotes and select add-ons before you confirm.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Schedule and pay securely
                  </h3>
                  <p className="text-sm text-slate-600">
                    Pick a time that works and pay safely with trusted payment
                    providers.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Track and review
                  </h3>
                  <p className="text-sm text-slate-600">
                    Get updates in real time, then leave feedback for the
                    provider.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">
              For products
            </h2>
            <ol className="mt-6 space-y-5">
              <li className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Shop curated essentials
                  </h3>
                  <p className="text-sm text-slate-600">
                    Explore trusted brands for maintenance, cleaning, and home
                    care.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Add to cart with confidence
                  </h3>
                  <p className="text-sm text-slate-600">
                    Detailed descriptions and reviews help you pick the right
                    items.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Fast checkout and delivery
                  </h3>
                  <p className="text-sm text-slate-600">
                    Secure payments with order tracking right in your account.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Support when you need it
                  </h3>
                  <p className="text-sm text-slate-600">
                    Easy returns and quick help with any order issues.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Vetted professionals
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Providers are verified with background checks, reviews, and
                quality monitoring.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Transparent pricing
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                See clear, upfront pricing with no surprise fees at checkout.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Secure payments
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Your payments are protected with trusted payment partners.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HowItWorksPage;
