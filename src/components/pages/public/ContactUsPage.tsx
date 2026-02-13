'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCreateContactMessage } from '@/lib/client/api';
import {
  contactMessageSchema,
  ContactMessageInput,
  contactSubjectEnum,
} from '@/lib/validations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formatSubjectLabel = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getShortErrorMessage = (message?: string) => {
  if (!message) return '';
  if (message.includes('Invalid option')) return 'Please select a subject.';
  return message;
};

const ContactUsPage = () => {
  const createContactMutation = useCreateContactMessage();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ContactMessageInput>({
    resolver: zodResolver(contactMessageSchema),
  });

  const onSubmit = async (data: ContactMessageInput) => {
    try {
      await createContactMutation.mutateAsync(data);
      reset();
    } catch (error) {
      // handled by mutation
    }
  };

  return (
    <section className="pt-28 pb-16">
      <div className="container mx-auto xl:px-0 px-4">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700 w-fit">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Contact Us
            </div>
            <h2 className="text-3xl font-bold text-slate-900 md:text-5xl">
              Ready to upgrade your <br className="hidden md:block" /> home
              experience?
            </h2>
            <p className="text-lg text-slate-600">
              We&apos;d love to hear from you! Whether you need help with home
              services, want to ask about products, or simply say hello, reach
              out using the form. Let&apos;s start the conversation and explore
              how Rute can help you.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">
                Follow our social accounts
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Connect with us for updates and tips.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href="https://facebook.com"
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-green-500 hover:text-green-600"
                >
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link
                  href="https://x.com"
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-green-500 hover:text-green-600"
                >
                  <Twitter className="h-5 w-5" />
                </Link>
                <Link
                  href="https://instagram.com"
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-green-500 hover:text-green-600"
                >
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link
                  href="https://linkedin.com"
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-green-500 hover:text-green-600"
                >
                  <Linkedin className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:pl-6">
            <div className="rounded-2xl bg-linear-to-b from-green-600 via-green-700 to-emerald-800 text-white shadow-xl p-4 md:p-10">
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold">Send Rute a message</h2>
                <p className="text-sm md:text-base text-white/90">
                  Tell us whether you need home services or product help, and
                  we&apos;ll get back to you quickly.
                </p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
                <div className="md:rounded-2xl md:bg-white/10 md:border md:border-white/20 md:p-6 md:backdrop-blur-sm flex flex-col gap-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 flex flex-col gap-1 md:col-span-6">
                      <Label htmlFor="name" className="text-white/90 text-sm">
                        Name
                      </Label>
                      <Input
                        id="name"
                        className="mt-2 bg-white/95 text-slate-900 h-11 rounded-xl border-0 focus-visible:ring-2 focus-visible:ring-white/70 placeholder:text-slate-400"
                        placeholder="Name"
                        {...register('name')}
                      />
                      {errors.name && (
                        <p className="text-xs text-rose-100 mt-1 leading-snug wrap-break-word">
                          {getShortErrorMessage(errors.name.message)}
                        </p>
                      )}
                    </div>
                    <div className="col-span-12 flex flex-col gap-1 md:col-span-6">
                      <Label htmlFor="email" className="text-white/90 text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        className="mt-2 bg-white/95 text-slate-900 h-11 rounded-xl border-0 focus-visible:ring-2 focus-visible:ring-white/70 placeholder:text-slate-400"
                        placeholder="Email"
                        {...register('email')}
                      />
                      {errors.email && (
                        <p className="text-xs text-rose-100 mt-1 leading-snug wrap-break-word">
                          {getShortErrorMessage(errors.email.message)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 flex flex-col gap-1 md:col-span-6">
                      <Label htmlFor="phone" className="text-white/90 text-sm">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        className="mt-2 bg-white/95 text-slate-900 h-11 rounded-xl border-0 focus-visible:ring-2 focus-visible:ring-white/70 placeholder:text-slate-400"
                        placeholder="Phone"
                        {...register('phone')}
                      />
                    </div>
                    <div className="col-span-12 flex flex-col gap-1 md:col-span-6">
                      <Label
                        htmlFor="subject"
                        className="text-white/90 text-sm"
                      >
                        Subject
                      </Label>
                      <Controller
                        name="subject"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              const typedValue =
                                value as ContactMessageInput['subject'];
                              field.onChange(typedValue);
                              setValue('subject', typedValue, {
                                shouldDirty: true,
                              });
                            }}
                          >
                            <SelectTrigger
                              id="subject"
                              className="mt-2 text-slate-900 border-0 bg-white/95 h-11 rounded-xl focus:ring-2 focus:ring-white/70"
                            >
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {contactSubjectEnum.options.map((value) => (
                                <SelectItem key={value} value={value}>
                                  {formatSubjectLabel(value)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.subject && (
                        <p className="text-xs text-rose-100 mt-1 leading-snug wrap-break-word">
                          {getShortErrorMessage(errors.subject.message)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="message" className="text-white/90 text-sm">
                      Message
                    </Label>
                    <textarea
                      id="message"
                      rows={6}
                      className="mt-2 w-full rounded-xl border-0 bg-white/95 px-3 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-white/70 placeholder:text-slate-400"
                      placeholder="Message"
                      {...register('message')}
                    />
                    {errors.message && (
                      <p className="text-xs text-rose-100 mt-1 leading-snug wrap-break-word">
                        {getShortErrorMessage(errors.message.message)}
                      </p>
                    )}
                  </div>

                  <div className="mt-2">
                    <Button
                      type="submit"
                      className="w-full bg-white text-green-700 hover:bg-white/90 h-11 shadow-lg"
                      disabled={createContactMutation.isPending || !isDirty}
                    >
                      {createContactMutation.isPending
                        ? 'Sending...'
                        : 'Submit'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUsPage;
