import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ArrowRight } from 'lucide-react';

const faqs = [
  {
    question: 'How do I book a service?',
    answer:
      'Choose a service, pick a time, and confirm your booking. You will receive instant confirmation and updates.',
  },
  {
    question: 'Are the service providers verified?',
    answer:
      'Yes. We verify providers, check reviews, and monitor service quality to ensure you get trusted professionals.',
  },
  {
    question: 'Can I reschedule or cancel?',
    answer:
      'You can reschedule or cancel from your profile up to a certain time before the appointment.',
  },
  {
    question: 'How do payments work?',
    answer:
      'Payments are secure and cashless. You will see transparent pricing before confirming.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'We currently serve major cities across South Africa including Cape Town, Johannesburg, Pretoria, and Durban. Check our service area during booking.',
  },
  {
    question: 'Do you offer same-day services?',
    answer:
      'Yes! Many of our providers offer same-day availability. You can filter by available time slots when booking.',
  },
  {
    question: "What if I'm not satisfied with the service?",
    answer:
      'We have a satisfaction guarantee. Contact our support team within 24 hours and we will work to resolve the issue or provide a refund.',
  },
  {
    question: 'Are products delivered or do I need to collect?',
    answer:
      'Most products are delivered directly to your door. Delivery fees and timelines are shown at checkout before you complete your order.',
  },
];

const FAQSection = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">FAQ</h2>
          <p className="text-slate-600">Quick answers to common questions</p>
        </div>
        <div className="max-w-4xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <Collapsible
              key={faq.question}
              className="rounded-xl border border-slate-200 bg-white"
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-left">
                <span className="font-medium text-slate-900">
                  {faq.question}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-slate-600">
                {faq.answer}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
