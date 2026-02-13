import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui';

const AboutUsSection = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-green-50 via-emerald-50 to-white" />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-green-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="container mx-auto relative">
        <div className="rounded-3xl border border-green-100/60 bg-white/70 backdrop-blur py-8 px-4 lg:p-12 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-5">
              <Badge variant="secondary" className="w-fit text-sm">
                About Us
              </Badge>
              <h2 className="text-3xl font-bold text-slate-900">
                Professional home services with products to match
              </h2>
              <p className="text-slate-600">
                Rute is a modern platform that brings trusted home services and
                essential products together. We focus on quality, safety, and
                convenience so you can book with confidence and keep your home
                running smoothly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Vetted providers
                    </p>
                    <p className="text-sm text-slate-600">
                      Background checks, reviews, and ongoing quality checks.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Transparent pricing
                    </p>
                    <p className="text-sm text-slate-600">
                      Clear quotes and fair rates before you confirm.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Secure payments
                    </p>
                    <p className="text-sm text-slate-600">
                      Cashless checkout with trusted payment providers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Reliable support
                    </p>
                    <p className="text-sm text-slate-600">
                      Fast help with bookings, changes, or follow-ups.
                    </p>
                  </div>
                </div>
              </div>
              <Card className="border border-green-500 bg-green-500/10 backdrop-blur shadow-sm">
                <CardHeader>
                  <CardTitle>What we cover</CardTitle>
                  <CardDescription>
                    Services and products in one platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className="border border-green-500"
                    >
                      Cleaning
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="border border-green-500"
                    >
                      Plumbing
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="border border-green-500"
                    >
                      Electrical
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="border border-green-500"
                    >
                      Repairs
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="border border-green-500"
                    >
                      Gardening
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="border border-green-500"
                    >
                      Home essentials
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    From urgent fixes to everyday essentials, we bring it all
                    together for a complete home experience.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 h-full">
              <div className="rounded-2xl border border-green-100/60 bg-white/80 p-4 shadow-md">
                <Image
                  src="/image3.png"
                  alt="How Rute works"
                  width={900}
                  height={1200}
                  className="rounded-xl object-cover h-137.5"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;
