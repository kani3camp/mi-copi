import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-vitest", "@storybook/addon-a11y"],
  framework: "@storybook/nextjs-vite",
};

export default config;
