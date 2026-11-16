import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { useEffect, type ReactNode } from "react";
import { AppProvider } from "../src/components/providers/app-provider";
import "../src/app/globals.css";

function Frame({ theme, children }: { theme: string; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <AppProvider>
      <div className="min-h-screen bg-bg p-8 text-ink md:p-12">{children}</div>
    </AppProvider>
  );
}

const withTheme: Decorator = (Story, context) => (
  <Frame theme={context.globals.theme ?? "dark"}>
    <Story />
  </Frame>
);

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Colour theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "dark", title: "Dark" },
          { value: "light", title: "Light" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "dark" },
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: "todo" },
  },
  decorators: [withTheme],
};

export default preview;
