import React from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import { ClaimsDashboard } from "./ClaimsDashboard";

const theme = window.openai?.theme === "dark" ? webDarkTheme : webLightTheme;

createRoot(document.getElementById("root")!).render(
  <FluentProvider theme={theme}>
    <ClaimsDashboard />
  </FluentProvider>
);
