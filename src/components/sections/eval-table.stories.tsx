import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { caseStudies } from "@/content/projects";
import { EvalTable } from "./eval-table";

const evals = caseStudies[0].evals!;

const meta = {
  title: "Sections/EvalTable",
  component: EvalTable,
  args: { data: evals[0], accent: "var(--aqua)" },
  decorators: [
    (Story) => (
      <div className="max-w-2xl" style={{ ["--spot" as string]: "var(--aqua)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EvalTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AgentSuite: Story = {};
export const RetrievalSuite: Story = { args: { data: evals[1] } };
