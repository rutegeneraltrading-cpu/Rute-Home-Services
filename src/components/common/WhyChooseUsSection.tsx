import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import {
  ShieldCheck,
  DollarSign,
  Headphones,
  Award,
  Zap,
  Clock,
} from 'lucide-react';

const WhyChooseUsSection = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Verified Professionals',
      description: 'Every pro is background-checked, reviewed, and monitored.',
      stat: '100%',
      statLabel: 'Vetted Pros',
    },
    {
      icon: DollarSign,
      title: 'Transparent Pricing',
      description:
        'No surprises. See exact pricing before you confirm booking.',
      stat: 'Zero',
      statLabel: 'Hidden Fees',
    },
    {
      icon: Headphones,
      title: 'Dedicated Support',
      description: 'Fast, friendly help via chat, email, or phone 24/7.',
      stat: '2hr',
      statLabel: 'Avg Response',
    },
    {
      icon: Award,
      title: 'Quality Guarantee',
      description: 'Satisfaction guaranteed or we make it right, no questions.',
      stat: '98%',
      statLabel: 'Satisfaction',
    },
    {
      icon: Zap,
      title: 'Easy Booking',
      description: 'Book in minutes with secure, cashless checkout.',
      stat: '<5min',
      statLabel: 'Avg Booking',
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Same-day or scheduled services to fit your life.',
      stat: '7-day',
      statLabel: 'Availability',
    },
  ];

  return (
    <section className="py-20 bg-linear-to-b from-white via-green-50/30 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-green-100/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-100/20 blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="w-fit mx-auto mb-4">
            Why Choose Rute
          </Badge>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Built for reliability and trust
          </h2>
          <p className="text-slate-600 text-lg">
            We&apos;ve designed every aspect of Rute to make home services
            simple, safe, and transparent. Here&apos;s what sets us apart.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border border-green-100/40 bg-white/70 backdrop-blur hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-green-700" />
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {feature.stat}
                      </p>
                      <p className="text-xs text-slate-500">
                        {feature.statLabel}
                      </p>
                    </div>
                  </div>
                  <CardTitle className="text-lg text-slate-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="bg-white/60 backdrop-blur rounded-2xl border border-green-100/40 p-8 text-center">
          <p className="text-slate-700 font-medium mb-4">
            Trusted by thousands of homeowners
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="outline">4.9★ Rated</Badge>
            <Badge variant="outline">10K+ Bookings</Badge>
            <Badge variant="outline">Licensed & Insured</Badge>
            <Badge variant="outline">Money-Back Guarantee</Badge>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
