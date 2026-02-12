const TermsAndConditionPage = () => {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="container mx-auto py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              Terms & conditions
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              Terms for using Rute home services and products
            </h1>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              These terms explain how you can use the platform, book services,
              and purchase products. By using Rute, you agree to the following
              conditions.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                1. Platform overview
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Rute provides a marketplace that connects customers with home
                service providers and offers a store for home-related products.
                Service providers are independent professionals who set their
                availability and fulfill bookings.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                2. Accounts and eligibility
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                You must provide accurate information, keep your credentials
                secure, and be at least 18 years old or have guardian
                permission. You are responsible for activity on your account.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                3. Booking services
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Service availability, pricing, and duration are shown before
                confirmation. Once booked, you will receive a confirmation and
                can manage appointments from your account.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                4. Payments and fees
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Payments are processed through secure payment providers. You
                agree to pay the listed price, taxes, and any applicable service
                fees displayed at checkout.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                5. Cancellations and rescheduling
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Cancellation windows and rescheduling rules vary by service and
                are shown during booking. Late cancellations may incur charges.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                6. Product orders
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Product availability, shipping times, and return conditions are
                shown at checkout. Orders may be fulfilled by Rute or approved
                partners.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                7. User responsibilities
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                You agree to provide a safe working environment for service
                providers and accurate job details. Misuse of the platform may
                result in account suspension.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                8. Provider responsibilities
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Providers must deliver services as described, comply with
                applicable laws, and maintain professional conduct.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                9. Limitation of liability
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Rute is not liable for indirect damages or losses arising from
                the use of the platform. Our liability is limited to the amount
                paid for the specific service or order.
              </p>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Need help?
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Contact support for billing questions, order updates, or account
                help.
              </p>
              <div className="mt-4 text-sm text-slate-700">
                support@rute.com
              </div>
            </div>
            <div className="rounded-2xl border border-green-100 bg-green-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Last updated
              </h3>
              <p className="mt-2 text-sm text-slate-600">February 12, 2026</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default TermsAndConditionPage;
