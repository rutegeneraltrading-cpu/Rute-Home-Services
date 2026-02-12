import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from 'lucide-react';

const PublicFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-black text-white">
      <div className="container mx-auto py-14 md:h-80">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:h-full">
          <div className="flex flex-col justify-between md:h-full md:col-span-4">
            <h3 className="text-3xl font-bold text-white">
              RUTE<span className="text-green-600">.</span>
            </h3>
            <div className="mt-6 flex items-center gap-4 text-gray-300">
              <Link
                aria-label="Facebook"
                className="rounded-full border border-white/10 p-2 transition hover:border-green-600 hover:text-green-600"
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                aria-label="Twitter"
                className="rounded-full border border-white/10 p-2 transition hover:border-green-600 hover:text-green-600"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                aria-label="Instagram"
                className="rounded-full border border-white/10 p-2 transition hover:border-green-600 hover:text-green-600"
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-4 w-4" />
              </Link>
              <Link
                aria-label="LinkedIn"
                className="rounded-full border border-white/10 p-2 transition hover:border-green-600 hover:text-green-600"
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="md:col-span-2">
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
          <div className="md:col-span-2">
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
                <Link className="hover:text-green-600" href="/cart">
                  Cart
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li>
                <Link className="hover:text-green-600" href="/terms-and-conditions">
                  Terms & conditions
                </Link>
              </li>
              <li>
                <Link className="hover:text-green-600" href="/refund-policy">
                  Refund policy
                </Link>
              </li>
              <li>
                <Link className="hover:text-green-600" href="/privacy-policy">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-white">Contact Us</h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-green-600" />
                <a className="hover:text-green-600" href="tel:+27211234567">
                  +27 21 123 4567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-green-600" />
                <a
                  className="hover:text-green-600"
                  href="mailto:support@rute.com"
                >
                  support@rute.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-8 w-8 text-green-600" />
                <span>
                  Office 45, Long Street, Cape Town, 8001, South Africa
                </span>
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
