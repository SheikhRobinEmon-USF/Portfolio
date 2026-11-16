import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./button";
import { Magnetic } from "./magnetic";

const meta = {
  title: "UI/Button",
  component: Button,
  args: { children: "See selected work", variant: "primary", size: "md" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "glass", "outline", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Glass: Story = { args: { variant: "glass", children: "Ask my AI" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Ghost: Story = { args: { variant: "ghost" } };

export const WithIcons: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-3">
      <Button {...args}>
        Read the case study <ArrowRight size={16} />
      </Button>
      <Button {...args} variant="glass">
        <Sparkles size={16} className="text-accent" /> Ask my AI
      </Button>
    </div>
  ),
};

export const MagneticPull: Story = {
  name: "Magnetic",
  render: (args) => (
    <Magnetic>
      <Button {...args} size="lg" />
    </Magnetic>
  ),
};
