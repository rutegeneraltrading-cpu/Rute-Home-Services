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
    <section className="pt-28">
      <div className="container mx-auto">
        <div className="flex flex-col-reverse justify-between gap-16 pb-10 lg:flex-row lg:gap-8">
          <div className="lg:w-1/2">
            <div className="flex flex-col gap-6">
              <p className="text-xl font-semibold uppercase text-slate-800">
                Get in touch
              </p>
              <h2 className="text-2xl font-semibold text-green-600 md:text-5xl">
                Ready to upgrade your <br /> home experience?
              </h2>
              <p className="text-lg font-normal text-slate-600">
                We&apos;d love to hear from you! Whether you need help with home
                services, want to ask about products, or simply say hello, reach
                out using the form. Let&apos;s start the conversation and
                explore how Rute can help you.
              </p>
              <div className="flex flex-col gap-3">
                <h3 className="text-2xl font-medium text-green-600 md:text-3xl">
                  Follow our social accounts
                </h3>
                <div className="flex items-center gap-2">
                  <Link
                    href="https://facebook.com"
                    className="rounded-full border border-slate-200 p-2 text-slate-600 hover:text-green-600"
                  >
                    <Facebook className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://x.com"
                    className="rounded-full border border-slate-200 p-2 text-slate-600 hover:text-green-600"
                  >
                    <Twitter className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://instagram.com"
                    className="rounded-full border border-slate-200 p-2 text-slate-600 hover:text-green-600"
                  >
                    <Instagram className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://linkedin.com"
                    className="rounded-full border border-slate-200 p-2 text-slate-600 hover:text-green-600"
                  >
                    <Linkedin className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="rounded-xl bg-linear-to-b from-green-600 via-green-700 to-emerald-800 text-white shadow-lg p-10">
              <div className="flex flex-col gap-3">
                <h2 className="text-3xl font-bold">Send Rute a message</h2>
                <p className="text-xs md:text-lg">
                  Tell us whether you need home services or product help, and
                  we&apos;ll get back to you quickly.
                </p>
              </div>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 flex flex-col gap-1 md:col-span-6">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      className="mt-2 bg-white text-slate-800 h-10"
                      placeholder="Name"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-12 flex flex-col gap-1 md:col-span-6">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="mt-2 bg-white text-slate-800 h-10"
                      placeholder="Email"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 flex flex-col gap-1 md:col-span-6">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      className="mt-2 bg-white text-slate-800 h-10"
                      placeholder="Phone"
                      {...register('phone')}
                    />
                  </div>
                  <div className="col-span-12 flex flex-col gap-1 md:col-span-6">
                    <Label htmlFor="subject">Subject</Label>
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
                          <SelectTrigger id="subject" className="mt-2 text-black">
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
                      <p className="text-sm text-red-500 mt-1">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    rows={6}
                    className="mt-2 w-full rounded-md border border-transparent bg-white px-3 py-3 text-sm text-slate-800"
                    placeholder="Message"
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <Button
                    type="submit"
                    className="w-full bg-white text-green-700 hover:bg-white/90"
                    disabled={createContactMutation.isPending || !isDirty}
                  >
                    {createContactMutation.isPending ? 'Sending...' : 'Submit'}
                  </Button>
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
