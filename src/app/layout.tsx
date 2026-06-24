

import type { Metadata } from "next";
import { Prompt} from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const promp = Prompt({ 
  weight: ['300', '400', '500', '600', '700'], 
  subsets: ['thai', 'latin'],
  variable: '--font-prompt',
});

export const metadata: Metadata = {
  title: "Attendance Marking System",
  description: "Modern employee attendance tracking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <body
        className={`${promp.className} antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
