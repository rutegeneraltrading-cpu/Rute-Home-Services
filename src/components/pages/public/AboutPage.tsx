import Link from 'next/link';
import { ShieldCheck, Star, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import AboutServicesGrid from './AboutServicesGrid';

const values = [
  {
    icon: ShieldCheck,
    title: 'Vetted Professionals',
    description:
      'Every worker on Rute is background-checked and verified before they can accept bookings. Your safety is our baseline, not a bonus.',
  },
  {
    icon: Star,
    title: 'Quality Guaranteed',
    description:
      'We stand behind every booking. If the job does not meet your expectations, our support team is here to make it right.',
  },
  {
    icon: Users,
    title: 'Built for South Africans',
    description:
      'Rute was built with the South African home in mind — from load-shedding repairs to moving across Joburg. We understand your needs.',
  },
  {
    icon: MapPin,
    title: 'Serving Johannesburg & Pretoria',
    description:
      'We currently operate across Johannesburg and Pretoria, with plans to expand to more cities across South Africa.',
  },
];

const AboutPage = () => {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-100 px-4">
        <div className="absolute inset-0 bg-linear-to-br from-green-50 via-emerald-50 to-white" />
        <div className="container mx-auto relative py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              About Rute
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-5xl leading-tight">
              Connecting South African homes with trusted professionals
            </h1>
            <p className="mt-5 text-base text-slate-600 md:text-lg max-w-2xl">
              Rute is a South African home services platform that makes it easy
              to book verified professionals and shop quality home products —
              all in one place. From Johannesburg to Pretoria, we are building
              the most reliable way to care for your home.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/services">Book a Service</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              Our Mission
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
              Making home care stress-free for every South African
            </h2>
            <p className="mt-4 text-slate-600">
              Finding a reliable handyman, electrician, or cleaner in South
              Africa used to mean hours of phone calls, uncertain quotes, and
              crossed fingers. Rute changes that.
            </p>
            <p className="mt-3 text-slate-600">
              We built a platform where you can browse services, see transparent
              pricing, pick a time that works for you, and pay securely — all
              before a professional steps through your door. No guesswork, no
              cash handoffs, no surprises.
            </p>
            <p className="mt-3 text-slate-600">
              For workers, Rute provides a steady stream of verified bookings,
              fair payouts, and a platform that treats them as professionals —
              because that is exactly what they are.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-green-50 border border-green-100 p-6 text-center">
              <p className="text-4xl font-bold text-green-700">2+</p>
              <p className="mt-1 text-sm text-slate-600">Cities Served</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center">
              <p className="text-4xl font-bold text-slate-800">7+</p>
              <p className="mt-1 text-sm text-slate-600">Service Categories</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center">
              <p className="text-4xl font-bold text-slate-800">100%</p>
              <p className="mt-1 text-sm text-slate-600">Vetted Workers</p>
            </div>
            <div className="rounded-2xl bg-green-50 border border-green-100 p-6 text-center">
              <p className="text-4xl font-bold text-green-700">Secure</p>
              <p className="mt-1 text-sm text-slate-600">Online Payments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-slate-50 border-y border-slate-100 px-4 py-16 md:py-20">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              What We Offer
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
              Home services for every need
            </h2>
            <p className="mt-3 text-slate-600">
              Whether your geyser burst at midnight or you need a full house
              repaint, Rute has a vetted professional ready for the job.
            </p>
          </div>
          <AboutServicesGrid />
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
            Why Rute
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
            What sets us apart
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-sm transition-shadow"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 mb-4">
                <Icon className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      {/* <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          Have questions about Rute?
        </h2>
        <p className="mt-3 text-slate-600 max-w-xl mx-auto">
          Our team is based in South Africa and ready to help with anything —
          service inquiries, partnerships, or just a chat.
        </p>
        <Button asChild className="mt-6 bg-green-600 hover:bg-green-700">
          <Link href="/contact-us">Get in Touch</Link>
        </Button>
      </section> */}

      {/* Workers CTA */}
      <section className="bg-green-600 px-4 py-16 md:py-20">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Are you a home services professional?
          </h2>
          <p className="mt-3 text-green-100">
            Join Rute&apos;s growing network of verified workers in Johannesburg
            and Pretoria. Get a steady flow of bookings, fair pay, and a
            platform that has your back.
          </p>
          <Button
            asChild
            className="mt-8 bg-white text-green-700 hover:bg-green-50 font-semibold"
          >
            <Link href="/register/worker">Become a Worker</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
