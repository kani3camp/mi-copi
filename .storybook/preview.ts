import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";
import "../src/app/ui/accessibility.css";
import "../src/app/design-system-v2.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
    },
  },
};

export default preview;
