"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "./theme-provider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient();
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar
          />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default Providers;
