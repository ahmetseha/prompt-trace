import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "@/components/chart-card";

interface ModelChartProps {
  data: { model: string; count: number; cost?: number }[];
}

export function ModelChart({ data }: ModelChartProps) {
  const totalCost = data.reduce((sum, d) => sum + (d.cost || 0), 0);

  return (
    <ChartCard
      title="Top Models"
      description={totalCost > 0 ? `$${totalCost.toFixed(0)} est. total` : "Prompts by AI model"}
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
              dataKey="model"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              width={120}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              itemStyle={{ color: "#e4e4e7" }}
            />
            <Bar
              activeBar={false}
              dataKey="count"
              fill="#6366f1"
              fillOpacity={0.8}
              radius={[0, 4, 4, 0]}
              name="Prompts"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
