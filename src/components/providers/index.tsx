"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "./theme-provider";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_00 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - cache time (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      refetchOnMount: true, // Refetch if data is stale when component mounts
      refetchOnReconnect: false, // Don't refetch on reconnect
      retry: 1, // Retry failed requests once
    },
    mutations: {
      retry: 1,
    },
  },
});

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
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
      </SessionProvider>
    </QueryClientProvider>
  );
};

export default Providers;
