import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carrier Sales Dashboard - HappyRobot',
  description: 'Inbound carrier sales automation dashboard with call analytics',
  robots: {
    index: false,
    follow: false
  }
};

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className='bg-background min-h-screen'>{children}</div>;
}
