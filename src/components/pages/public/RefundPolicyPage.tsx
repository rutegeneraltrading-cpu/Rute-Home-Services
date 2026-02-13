const RefundPolicyPage = () => {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="container mx-auto py-14 md:py-20 xl:px-0 px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              Refund policy
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              Refunds for services and product orders
            </h1>
            <p className="mt-4 text-base text-slate-600 md:text-lg">
              We aim to keep everything fair and transparent. This policy
              explains when refunds apply for bookings and store purchases.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-12 md:py-16 xl:px-0 px-4">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Service bookings
            </h2>
            <ul className="space-y-4 text-sm text-slate-600">
              <li>
                <span className="font-semibold text-slate-900">
                  Full refund:
                </span>{' '}
                Available when you cancel within the free cancellation window
                shown at booking.
              </li>
              <li>
                <span className="font-semibold text-slate-900">
                  Partial refund:
                </span>{' '}
                May apply for late cancellations or reschedules depending on
                provider policy.
              </li>
              <li>
                <span className="font-semibold text-slate-900">
                  Service issues:
                </span>{' '}
                If a provider doesn’t complete the service as agreed, contact
                support within 48 hours for review.
              </li>
            </ul>
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5 text-sm text-slate-700">
              Please keep photos and details ready if you report a service
              issue. This helps us resolve cases faster.
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Product orders
            </h2>
            <ul className="space-y-4 text-sm text-slate-600">
              <li>
                <span className="font-semibold text-slate-900">Returns:</span>{' '}
                Eligible items can be returned within 7 days of delivery if
                unused and in original packaging.
              </li>
              <li>
                <span className="font-semibold text-slate-900">
                  Damaged items:
                </span>{' '}
                Report damage within 24 hours of delivery with photos.
              </li>
              <li>
                <span className="font-semibold text-slate-900">
                  Refund timing:
                </span>{' '}
                Approved refunds are processed to the original payment method
                within 5–10 business days.
              </li>
            </ul>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
              Some items such as perishable goods or custom orders may be
              non-refundable. The product page will clearly show this.
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-100 bg-slate-50 p-8">
          <h3 className="text-lg font-semibold text-slate-900">
            How to request a refund
          </h3>
          <ol className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-slate-600">
            <li className="rounded-2xl bg-white p-4 shadow-sm">
              Go to your bookings or orders in your account.
            </li>
            <li className="rounded-2xl bg-white p-4 shadow-sm">
              Select the booking or order and choose “Request refund”.
            </li>
            <li className="rounded-2xl bg-white p-4 shadow-sm">
              Submit details and any supporting photos.
            </li>
          </ol>
        </div>
      </section>
    </main>
  );
};

export default RefundPolicyPage;
