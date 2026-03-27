import { redirect } from 'next/navigation';

export default async function Dashboard() {
  // Auth disabled - redirect directly to overview
  redirect('/dashboard/overview');
}
