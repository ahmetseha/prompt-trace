import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartCard } from "@/components/chart-card";
import { getCategoryColor } from "@/components/category-badge";
import type { PromptCategory } from "@/lib/types";

interface CategoryChartProps {
  data: { category: string; count: number }[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <ChartCard
      title="Prompt Categories"
      description="Distribution of prompt types"
    >
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart
            data={data.slice(0, 8)}
            layout="vertical"
            margin={{ top: 0, right: 5, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              width={110}
            />
            <Tooltip cursor={{ fill: "transparent" }}
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              itemStyle={{ color: "#e4e4e7" }}
            />
            <Bar activeBar={false} dataKey="count" radius={[0, 4, 4, 0]} name="Prompts">
              {data.slice(0, 8).map((entry) => (
                <Cell
                  key={entry.category}
                  fill={getCategoryColor(entry.category as PromptCategory)}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
