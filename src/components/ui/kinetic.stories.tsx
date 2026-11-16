import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef } from "react";
import { KineticWord, useKineticType } from "./kinetic";

function Headline({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useKineticType(ref, enabled);
  return (
    <h1 ref={ref} className="font-display text-[clamp(3rem,10vw,9rem)] [--wdth:86]">
      <span className="block">
        <KineticWord text="AI" /> <KineticWord text="products," />
      </span>
      <span className="block">
        <KineticWord text="from" /> <span className="serif-accent text-gradient">discovery</span>
      </span>
      <span className="block">
        <KineticWord text="to" /> <KineticWord text="production." />
      </span>
    </h1>
  );
}

const meta = {
  title: "UI/KineticType",
  component: Headline,
  args: { enabled: true },
  parameters: {
    docs: {
      description: {
        component:
          "Variable-font headline. Each character's weight and width follow the cursor; without a fine pointer a slow wave rolls through instead.",
      },
    },
  },
} satisfies Meta<typeof Headline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
export const Static: Story = { args: { enabled: false } };
