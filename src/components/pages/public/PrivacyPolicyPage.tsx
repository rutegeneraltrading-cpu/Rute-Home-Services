const PrivacyPolicyPage = () => {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="container mx-auto py-14 md:py-20 xl:px-0 px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              Privacy policy
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              How we collect, use, and protect your information
            </h1>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              This policy explains what data we collect, why we collect it, and
              how you can control your information when using Rute services and
              shopping.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-12 md:py-16 xl:px-0 px-4">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                1. Information we collect
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                We collect account details (name, email, phone), booking and
                order history, address information for service delivery, and
                payment confirmation tokens from our payment partners.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                2. How we use your data
              </h2>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                <li>Provide and manage service bookings and product orders.</li>
                <li>Send confirmations, reminders, and support updates.</li>
                <li>
                  Improve platform quality and personalize recommendations.
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                3. Sharing of information
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                We share only what is necessary with service providers, delivery
                partners, and payment processors. We never sell your personal
                data to third parties.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                4. Data security
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                We use industry-standard security practices to protect your
                information, including encryption and access controls.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                5. Your choices
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                You can update your profile, manage notification preferences, or
                request data deletion by contacting support.
              </p>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Contact privacy team
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                For privacy requests or questions, reach us at:
              </p>
              <div className="mt-4 text-sm text-slate-700">
                privacy@rute.com
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

export default PrivacyPolicyPage;
