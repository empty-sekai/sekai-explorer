import "./styles.css";
import "~/lib/theme";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { queryClient } from "~/lib/query";
import { getLocale } from "~/paraglide/runtime.js";
import { router } from "~/router";

document.documentElement.lang = getLocale();

const element = document.getElementById("root");
if (!element) throw new Error("index.html has no #root");

createRoot(element).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
