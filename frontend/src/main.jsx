import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/react";
import { App } from "./App.jsx";
import "./index.css";

const customLocalization = {
  signUp: {
    start: {
      title: "Get started with Tally",
      subtitle: "Sign up using Google to organize your lists.",
    },
  },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={import.meta.env.CLERK_PUBLISHABLE_KEY}
      localization={customLocalization}
    >
      <App />
    </ClerkProvider>
    <Toaster />
  </StrictMode>,
);
