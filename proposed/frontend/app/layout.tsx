"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>NXCertify - University Certificate Verification System</title>
        <meta
          name="description"
          content="Secure blockchain-based university certificate issuance and verification system"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProvider client={queryClient}>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 min-h-[calc(100vh-200px)]">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster richColors position="bottom-right" />
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
