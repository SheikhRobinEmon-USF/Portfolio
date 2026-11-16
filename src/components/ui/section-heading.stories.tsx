import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionHeading } from "./section-heading";

const meta = {
  title: "UI/SectionHeading",
  component: SectionHeading,
  args: {
    index: "02",
    label: "Selected work",
    title: "Built, evaluated and open-sourced",
    lede: "AI tools designed and built end to end.",
  },
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAccent: Story = {
  args: {
    title: (
      <>
        Built, evaluated and <span className="serif-accent text-gradient">open-sourced</span>
      </>
    ),
  },
};
