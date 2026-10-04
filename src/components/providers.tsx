"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user": animasi gerak otomatis dimatikan bagi pengguna yang memintanya */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      {/* Di atas, supaya tidak menabrak bottom navigation di HP */}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
