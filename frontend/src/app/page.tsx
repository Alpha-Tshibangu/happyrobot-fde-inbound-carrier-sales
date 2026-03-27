import { redirect } from 'next/navigation';

export default async function Page() {
  // Auth disabled - redirect directly to dashboard
  redirect('/dashboard/overview');
}
