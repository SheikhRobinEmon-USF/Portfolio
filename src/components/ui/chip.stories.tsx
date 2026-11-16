import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Chip } from "./chip";

const meta = {
  title: "UI/Chip",
  component: Chip,
  args: { children: "LangGraph", tone: "default" },
  argTypes: { tone: { control: "inline-radio", options: ["default", "accent", "solid"] } },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Accent: Story = { args: { tone: "accent" } };
export const Solid: Story = { args: { tone: "solid" } };

export const Stack: Story = {
  render: () => (
    <div className="flex max-w-md flex-wrap gap-2">
      {["Python", "FastAPI", "Claude API", "MCP", "RAG", "AWS Bedrock", "Power BI"].map((s) => (
        <Chip key={s}>{s}</Chip>
      ))}
    </div>
  ),
};
