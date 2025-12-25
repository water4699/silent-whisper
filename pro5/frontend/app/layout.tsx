import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Encrypted Salary Compare",
  description: "Compare salaries privately using Fully Homomorphic Encryption",
  keywords: ["FHE", "privacy", "salary comparison", "blockchain", "encryption", "web3"],
  authors: [{ name: "Encrypted Salary Compare Team" }],
  openGraph: {
    title: "Encrypted Salary Compare",
    description: "Compare salaries privately using Fully Homomorphic Encryption",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/salary-icon.png" />
      </head>
      <body className={`bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen text-foreground antialiased`}>
        <main className="flex flex-col max-w-7xl mx-auto pb-20 px-4">
          <Providers>
            <Header />
            {children}
          </Providers>
        </main>
      </body>
    </html>
  );
}
