"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/app/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/app/components/ui/toggle-group"

export const description = "Platform activity: search queries vs AI generations (dummy)"

/** Dummy time series: searches (RAG) and AI generations per day. */
const chartData = [
  { date: "2024-04-01", searches: 98, generations: 12 },
  { date: "2024-04-02", searches: 112, generations: 18 },
  { date: "2024-04-03", searches: 87, generations: 9 },
  { date: "2024-04-04", searches: 134, generations: 22 },
  { date: "2024-04-05", searches: 156, generations: 28 },
  { date: "2024-04-06", searches: 142, generations: 19 },
  { date: "2024-04-07", searches: 118, generations: 14 },
  { date: "2024-04-08", searches: 167, generations: 31 },
  { date: "2024-04-09", searches: 94, generations: 11 },
  { date: "2024-04-10", searches: 128, generations: 20 },
  { date: "2024-04-11", searches: 145, generations: 24 },
  { date: "2024-04-12", searches: 138, generations: 17 },
  { date: "2024-04-13", searches: 152, generations: 26 },
  { date: "2024-04-14", searches: 121, generations: 15 },
  { date: "2024-04-15", searches: 109, generations: 13 },
  { date: "2024-04-16", searches: 131, generations: 21 },
  { date: "2024-04-17", searches: 178, generations: 29 },
  { date: "2024-04-18", searches: 165, generations: 27 },
  { date: "2024-04-19", searches: 139, generations: 16 },
  { date: "2024-04-20", searches: 102, generations: 10 },
  { date: "2024-04-21", searches: 126, generations: 18 },
  { date: "2024-04-22", searches: 143, generations: 23 },
  { date: "2024-04-23", searches: 117, generations: 14 },
  { date: "2024-04-24", searches: 159, generations: 25 },
  { date: "2024-04-25", searches: 148, generations: 20 },
  { date: "2024-04-26", searches: 96, generations: 8 },
  { date: "2024-04-27", searches: 172, generations: 30 },
  { date: "2024-04-28", searches: 124, generations: 17 },
  { date: "2024-04-29", searches: 151, generations: 22 },
  { date: "2024-04-30", searches: 183, generations: 32 },
  { date: "2024-05-01", searches: 132, generations: 19 },
  { date: "2024-05-02", searches: 161, generations: 26 },
  { date: "2024-05-03", searches: 141, generations: 21 },
  { date: "2024-05-04", searches: 168, generations: 28 },
  { date: "2024-05-05", searches: 189, generations: 33 },
  { date: "2024-05-06", searches: 197, generations: 35 },
  { date: "2024-05-07", searches: 175, generations: 27 },
  { date: "2024-05-08", searches: 138, generations: 18 },
  { date: "2024-05-09", searches: 152, generations: 23 },
  { date: "2024-05-10", searches: 164, generations: 25 },
  { date: "2024-05-11", searches: 171, generations: 29 },
  { date: "2024-05-12", searches: 149, generations: 20 },
  { date: "2024-05-13", searches: 146, generations: 16 },
  { date: "2024-05-14", searches: 185, generations: 31 },
  { date: "2024-05-15", searches: 192, generations: 34 },
  { date: "2024-05-16", searches: 169, generations: 26 },
  { date: "2024-05-17", searches: 201, generations: 36 },
  { date: "2024-05-18", searches: 178, generations: 28 },
  { date: "2024-05-19", searches: 155, generations: 22 },
  { date: "2024-05-20", searches: 162, generations: 24 },
  { date: "2024-05-21", searches: 119, generations: 12 },
  { date: "2024-05-22", searches: 127, generations: 15 },
  { date: "2024-05-23", searches: 173, generations: 27 },
  { date: "2024-05-24", searches: 166, generations: 25 },
  { date: "2024-05-25", searches: 158, generations: 21 },
  { date: "2024-05-26", searches: 144, generations: 19 },
  { date: "2024-05-27", searches: 194, generations: 33 },
  { date: "2024-05-28", searches: 163, generations: 23 },
  { date: "2024-05-29", searches: 114, generations: 11 },
  { date: "2024-05-30", searches: 181, generations: 30 },
  { date: "2024-05-31", searches: 157, generations: 22 },
  { date: "2024-06-01", searches: 153, generations: 20 },
  { date: "2024-06-02", searches: 198, generations: 35 },
  { date: "2024-06-03", searches: 122, generations: 14 },
  { date: "2024-06-04", searches: 187, generations: 32 },
  { date: "2024-06-05", searches: 118, generations: 13 },
  { date: "2024-06-06", searches: 176, generations: 28 },
  { date: "2024-06-07", searches: 182, generations: 29 },
  { date: "2024-06-08", searches: 179, generations: 26 },
  { date: "2024-06-09", searches: 205, generations: 37 },
  { date: "2024-06-10", searches: 147, generations: 18 },
  { date: "2024-06-11", searches: 129, generations: 16 },
  { date: "2024-06-12", searches: 206, generations: 38 },
  { date: "2024-06-13", searches: 115, generations: 10 },
  { date: "2024-06-14", searches: 190, generations: 31 },
  { date: "2024-06-15", searches: 178, generations: 27 },
  { date: "2024-06-16", searches: 184, generations: 30 },
  { date: "2024-06-17", searches: 212, generations: 40 },
  { date: "2024-06-18", searches: 135, generations: 17 },
  { date: "2024-06-19", searches: 188, generations: 29 },
  { date: "2024-06-20", searches: 196, generations: 34 },
  { date: "2024-06-21", searches: 154, generations: 21 },
  { date: "2024-06-22", searches: 180, generations: 26 },
  { date: "2024-06-23", searches: 209, generations: 39 },
  { date: "2024-06-24", searches: 142, generations: 19 },
  { date: "2024-06-25", searches: 151, generations: 22 },
  { date: "2024-06-26", searches: 193, generations: 33 },
  { date: "2024-06-27", searches: 199, generations: 36 },
  { date: "2024-06-28", searches: 148, generations: 20 },
  { date: "2024-06-29", searches: 128, generations: 15 },
  { date: "2024-06-30", searches: 203, generations: 37 },
]

const chartConfig = {
  searches: {
    label: "Search queries",
    color: "var(--primary)",
  },
  generations: {
    label: "AI generations",
    color: "var(--chart-2)",
  },
}

/**
 * Platform activity chart: search queries vs AI generations over time (dummy).
 * Time range: 7d / 30d / 90d.
 */
export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Platform activity</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Search queries vs AI generations (dummy)
          </span>
          <span className="@[540px]/card:hidden">Search vs AI (dummy)</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex">
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSearches" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-searches)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-searches)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillGenerations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-generations)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-generations)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot" />
              } />
            <Area
              dataKey="generations"
              type="natural"
              fill="url(#fillGenerations)"
              stroke="var(--color-generations)"
              stackId="a" />
            <Area
              dataKey="searches"
              type="natural"
              fill="url(#fillSearches)"
              stroke="var(--color-searches)"
              stackId="a" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
