import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Counter } from "./counter";
import { SpotlightCard } from "./spotlight-card";

const meta = {
  title: "UI/SpotlightCard",
  component: SpotlightCard,
  parameters: { docs: { description: { component: "Glass surface whose border and fill glow under the cursor." } } },
} satisfies Meta<typeof SpotlightCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MetricCard: Story = {
  render: () => (
    <SpotlightCard className="glass w-80 rounded-3xl p-7">
      <div className="font-display text-7xl [--wdth:82] [--wght:640]">
        <Counter value={48} suffix="%" />
      </div>
      <p className="label-mono mt-3 text-accent">annual revenue growth</p>
      <p className="mt-8 text-sm leading-relaxed text-soft">
        A real-time IoT stove-usage pipeline that sharpened pay-as-you-go collections for eCook.
      </p>
    </SpotlightCard>
  ),
};

export const CustomGlow: Story = {
  render: () => (
    <SpotlightCard className="glass w-80 rounded-3xl p-7" spot="var(--aqua)">
      <p className="font-display text-3xl">Move the cursor over me</p>
    </SpotlightCard>
  ),
};
