import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';
import { Badge, Button } from '../ui';

const HeroSection = () => {
  return (
    <section className="bg-linear-to-b from-green-50 to-white">
      <div className="container mx-auto py-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <Badge variant="secondary" className="w-fit">
            Trusted Home Services
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900">
            Book reliable home services in minutes
          </h1>
          <p className="text-lg text-slate-600 max-w-xl">
            Vetted professionals, transparent pricing, and secure payments — all
            in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/services">
                Book a service <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/shop">
                Shop products <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" /> Verified Pros
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-green-600" /> On-time service
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Secure
              payments
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="">
            <Image
              src="/image.png"
              alt="Rute platform - Home services and products marketplace"
              width={800}
              height={800}
              className="rounded-2xl object-cover w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
