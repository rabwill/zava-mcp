import React from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import { ClaimDetail } from "./ClaimDetail";

const theme = window.openai?.theme === "dark" ? webDarkTheme : webLightTheme;

createRoot(document.getElementById("root")!).render(
  <FluentProvider theme={theme}>
    <ClaimDetail />
  </FluentProvider>
);
