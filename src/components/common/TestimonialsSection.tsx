'use client';

import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui';

const testimonials = [
  {
    name: 'Ayesha Khan',
    role: 'Homeowner, Cape Town',
    quote:
      "I was skeptical at first about booking cleaning services online, but Rute made the entire process incredibly easy. From browsing available cleaners to booking and payment, everything was straightforward and transparent. The cleaner arrived exactly on time, was professional, courteous, and did an amazing job. What impressed me most was the follow-up communication and the satisfaction guarantee. I've already booked three more appointments and recommended Rute to all my friends. The pricing is fair and there were no hidden charges.",
    rating: 5,
    service: 'Cleaning Service',
  },
  {
    name: 'David Mokoena',
    role: 'Small Business Owner, Johannesburg',
    quote:
      "Running a small business means I don't have time to deal with maintenance issues. Rute has been a lifesaver for my office needs. I needed electrical work done urgently, and within hours of booking, a qualified electrician was at my office. The entire process was seamless with verified professionals and exact pricing upfront. No surprises, no hidden fees, just honest work. The electrician was efficient and professional. Customer service was responsive when I had questions. I now use Rute for all my office maintenance needs.",
    rating: 5,
    service: 'Electrical Repair',
  },
  {
    name: 'Sara Williams',
    role: 'Apartment Resident, Durban',
    quote:
      "I've always been anxious about letting strangers into my home, but Rute's verification process gave me complete peace of mind. I booked a handyman to fix shelves and repair a leaky tap. The background-checked professional arrived on time, communicated clearly about what needed to be done and the exact cost, and completed work efficiently. Everything was done right the first time. I appreciated the simplicity of booking - no long phone calls, no confusion, just quick and easy scheduling. The professional was friendly and cleaned up after himself.",
    rating: 4,
    service: 'Handyman Service',
  },
  {
    name: 'Marcus Thompson',
    role: 'Homeowner, Pretoria',
    quote:
      "I recently had a plumbing emergency on a weekend, and I was worried I wouldn't find anyone available or that it would cost a fortune. I tried Rute in desperation and was amazed at how quickly I found a plumber. Not only was someone available within hours, but the pricing was completely transparent. The plumber showed me exactly what needed to be done before starting work. The quality of work was excellent and the professional was courteous. Rute's support team was helpful when I had questions. This service has changed how I handle emergencies.",
    rating: 5,
    service: 'Plumbing Service',
  },
  {
    name: 'Nandi Patel',
    role: 'Young Professional, Sandton',
    quote:
      "As someone juggling a demanding job and a busy lifestyle, I don't have time for household chores. Rute has been a game-changer for me. I book gardening services monthly, and it's been reliable every single time. The professionals show up on time, do quality work, and actually care about results. What sets Rute apart is the accountability - every professional is verified and rated. I can read real reviews from other customers, which helps me choose the right person. The app is intuitive and payment is secure.",
    rating: 5,
    service: 'Garden & Cleaning',
  },
  {
    name: 'Robert Chen',
    role: 'Property Manager, Johannesburg',
    quote:
      "Managing multiple properties requires finding reliable service providers quickly. Rute has streamlined my maintenance operations significantly. I can request multiple services, get quotes instantly, and schedule them all through one platform. The professionals are consistently high-quality and understand property management needs. I've reduced my maintenance costs by 20% because there are no middlemen. The payment system is secure, invoicing is automatic, and everything is tracked. Rute has become an essential tool for my business.",
    rating: 5,
    service: 'Property Maintenance',
  },
  {
    name: 'Lindiwe Dlamini',
    role: 'Interior Designer, Cape Town',
    quote:
      "For my design projects, I often need to coordinate multiple service providers like painters, electricians, and carpenters. Rute has made this coordination so much easier. I can vet professionals, book them at specific times, and track their work - all in one place. The quality of work has been consistently high, and the professionals take pride in their craft. What I love is the transparency and professionalism. Everyone shows up on time, does quality work, and communicates clearly. They've become my go-to team.",
    rating: 5,
    service: 'Home Renovation',
  },
  {
    name: 'James Peterson',
    role: 'Senior Citizen, Johannesburg',
    quote:
      "At my age, doing household repairs myself is no longer an option, and I'm grateful for services like Rute that make it so easy to find help. The platform is simple to use - my grandchildren helped me set up my account, and now I can book services independently. The professionals are patient, respectful, and trustworthy. I've had electricians, plumbers, and handymen through Rute, and every single one has been professional and kind. Everyone is background-checked because security is important to me.",
    rating: 5,
    service: 'Home Maintenance',
  },
];

const TestimonialsSection = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      if (direction === 'left') {
        scrollContainerRef.current.scrollBy({
          left: -scrollAmount,
          behavior: 'smooth',
        });
      } else {
        scrollContainerRef.current.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <section className="py-20 bg-linear-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Loved by Homeowners Nationwide
          </h2>
          <p className="text-lg text-slate-600">
            See what thousands of satisfied customers are saying about their
            Rute experience
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-6 pb-4 scroll-smooth snap-x snap-mandatory"
            style={{
              scrollBehavior: 'smooth',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {testimonials.map((testimonial, index) => (
              <div key={index} className="shrink-0 w-full md:w-96 snap-start">
                <Card className="h-full min-h-96 border border-slate-200 bg-white hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  {/* Rating */}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-1">
                        {Array.from({ length: testimonial.rating }).map(
                          (_, i) => (
                            <Star
                              key={i}
                              className="h-5 w-5 fill-yellow-400 text-yellow-400"
                            />
                          ),
                        )}
                      </div>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        {testimonial.service}
                      </span>
                    </div>

                    {/* Quote */}
                    <p className="text-slate-700 text-sm leading-relaxed italic mb-4 grow">
                      {`"${testimonial.quote}"`}
                    </p>
                  </CardHeader>

                  {/* Author Info */}
                  <CardContent className="pt-4 border-t border-slate-100">
                    <div>
                      <CardTitle className="text-base text-slate-900">
                        {testimonial.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        {testimonial.role}
                      </CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Scroll Buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 rounded-full bg-white shadow-lg border border-slate-200 items-center justify-center hover:bg-slate-50 transition-colors ml-1.5"
          >
            <ChevronLeft className="h-6 w-6 text-slate-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 rounded-full bg-white shadow-lg border border-slate-200 items-center justify-center hover:bg-slate-50 transition-colors mr-1.5"
          >
            <ChevronRight className="h-6 w-6 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Hide scrollbar for all browsers */}
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;
