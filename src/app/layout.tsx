import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { DotGothic16, EB_Garamond, Space_Mono } from "next/font/google";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: "variable",
  style: "normal",
  variable: "--font-eb-garamond",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-space-mono",
});
const dotGothic = DotGothic16({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dot-gothic",
});

export const metadata: Metadata = {
  title: "zishinew.com",
  description:
    "zishine wang — software developer, mathematics @ university of waterloo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${garamond.variable} ${spaceMono.variable} ${dotGothic.variable}`}
    >
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
