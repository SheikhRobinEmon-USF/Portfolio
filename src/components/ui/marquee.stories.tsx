import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Marquee } from "./marquee";

const orgs = ["Tampa General Hospital", "UNICEF", "Arena by PTC", "University of South Florida", "Riseup Labs"];

const meta = {
  title: "UI/Marquee",
  component: Marquee,
  args: { duration: 30, reverse: false, children: null },
  render: (args) => (
    <Marquee {...args}>
      {orgs.map((o) => (
        <span key={o} className="font-display whitespace-nowrap px-8 text-3xl text-soft [--wght:500]">
          {o} <span className="pl-8 text-accent">✦</span>
        </span>
      ))}
    </Marquee>
  ),
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Reverse: Story = { args: { reverse: true } };
