import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { USER_OVERVIEW_METADATA } from '@/lib/seo';

export const metadata: Metadata = USER_OVERVIEW_METADATA;

export default function UserIndex() {
  redirect('/user/dashboard');
}
