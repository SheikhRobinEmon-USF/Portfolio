import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LensSwitch } from "./lens-switch";

const meta = {
  title: "UI/LensSwitch",
  component: LensSwitch,
  parameters: {
    docs: {
      description: {
        component:
          "Re-orders summaries, experience bullets, skills and products around the role a visitor is hiring for.",
      },
    },
  },
} satisfies Meta<typeof LensSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = { render: () => <div className="max-w-xl"><LensSwitch /></div> };
export const Compact: Story = { args: { compact: true }, render: (args) => <div className="max-w-sm"><LensSwitch {...args} /></div> };
