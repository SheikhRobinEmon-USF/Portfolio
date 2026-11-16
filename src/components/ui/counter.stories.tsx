import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Counter } from "./counter";

const meta = {
  title: "UI/Counter",
  component: Counter,
  args: { value: 1.3, decimals: 1, suffix: "M+", duration: 1.8 },
  decorators: [
    (Story) => (
      <div className="font-display text-8xl [--wdth:82] [--wght:640]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Counter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MonthlyActiveUsers: Story = {};
export const BeforeAndAfter: Story = { args: { value: 98, from: 48, decimals: 0, suffix: "%" } };
export const LargeInteger: Story = { args: { value: 6264, decimals: 0, suffix: "" } };
