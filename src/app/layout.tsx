import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed from Geist_Sans
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ // Changed from Geist_Sans, variable name 'inter' for clarity
  variable: '--font-geist-sans', // Kept original CSS variable name
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Desktop Maintenance Hub',
  description: 'Desktop application for maintenance tasks.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}> {/* Apply the font variable to html tag */}
      <body className="antialiased font-sans"> {/* font-sans from Tailwind will be overridden by globals.css body style */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
