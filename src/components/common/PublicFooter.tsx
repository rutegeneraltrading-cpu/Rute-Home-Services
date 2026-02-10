import Link from 'next/link';

const PublicFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-black text-white">
      <div className="container mx-auto py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Home Services
              </h3>
              <p className="mt-2 text-sm text-gray-300">
                Trusted professionals for cleaning, repairs, and maintenance.
              </p>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p>support@homeservices.com</p>
              <p>+27 11 123 4567</p>
              <p>Mon–Sat, 8:00–18:00</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li>
                <Link className="hover:text-green-600" href="/how-it-works">
                  How it works
                </Link>
              </li>
              <li>
                <Link className="hover:text-green-600" href="/contact-us">
                  Contact us
                </Link>
              </li>
              <li>
                <Link className="hover:text-green-600" href="/blogs">
                  Blogs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Services</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li>
                <Link className="hover:text-green-600" href="/services">
                  Browse services
                </Link>
              </li>
              <li>
                <Link className="hover:text-green-600" href="/shop">
                  Shop products
                </Link>
              </li>
              <li>
                <Link className="hover:text-green-600" href="/checkout">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li>
                <Link className="hover:text-green-600" href="/terms-conditions">
                  Terms & conditions
                </Link>
              </li>
              <li>
                <Link className="hover:text-green-600" href="/refund-policy">
                  Refund policy
                </Link>
              </li>
              <li>
                <Link className="hover:text-green-600" href="/privacy">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col items-start justify-between gap-4 py-6 text-sm text-gray-400 md:flex-row md:items-center">
          <p>© {year} Home Services. All rights reserved.</p>
        <div className="flex flex-wrap gap-4">
          <Link className="hover:text-green-600" href="/register/worker">
            Become a worker
          </Link>
        </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
