import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { EB_Garamond, Space_Mono } from "next/font/google";

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
      className={`${garamond.variable} ${spaceMono.variable}`}
    >
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
