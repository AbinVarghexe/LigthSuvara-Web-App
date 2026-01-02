"use client";

import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  desktop: {
    label: "Score",
    color: "hsl(217, 91%, 60%)", // Blue
  },
} satisfies ChartConfig;

export interface RadarChartData {
  forane: string;
  score: number;
}

interface ChartRadarDotsProps {
  data: RadarChartData[];
}

export function ChartRadarDots({ data }: ChartRadarDotsProps) {
  // If no data, show a placeholder or empty state, but for now just render chart which will be empty
  // Ensure we have data for the chart, handling empty case gracefully if needed
  const displayData =
    data.length > 0
      ? data
      : [
          { forane: "No Data", score: 0 },
          { forane: "No Data", score: 0 },
          { forane: "No Data", score: 0 },
        ];

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Forane Performance</CardTitle>
        <CardDescription>Average marks distribution by Forane</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={displayData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="forane" />
            <PolarGrid />
            <Radar
              dataKey="score"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Showing average marks across foranes{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  );
}
