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
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", completed: 8, failed: 1 },
  { date: "2024-04-02", completed: 5, failed: 0 },
  { date: "2024-04-03", completed: 7, failed: 1 },
  { date: "2024-04-04", completed: 12, failed: 0 },
  { date: "2024-04-05", completed: 15, failed: 2 },
  { date: "2024-04-06", completed: 10, failed: 0 },
  { date: "2024-04-07", completed: 8, failed: 0 },
  { date: "2024-04-08", completed: 14, failed: 1 },
  { date: "2024-04-09", completed: 6, failed: 0 },
  { date: "2024-04-10", completed: 9, failed: 0 },
  { date: "2024-04-11", completed: 13, failed: 1 },
  { date: "2024-04-12", completed: 11, failed: 0 },
  { date: "2024-04-13", completed: 14, failed: 1 },
  { date: "2024-04-14", completed: 7, failed: 0 },
  { date: "2024-04-15", completed: 6, failed: 0 },
  { date: "2024-04-16", completed: 5, failed: 1 },
  { date: "2024-04-17", completed: 16, failed: 0 },
  { date: "2024-04-18", completed: 15, failed: 2 },
  { date: "2024-04-19", completed: 9, failed: 0 },
  { date: "2024-04-20", completed: 4, failed: 0 },
  { date: "2024-04-21", completed: 7, failed: 0 },
  { date: "2024-04-22", completed: 8, failed: 1 },
  { date: "2024-04-23", completed: 6, failed: 0 },
  { date: "2024-04-24", completed: 12, failed: 1 },
  { date: "2024-04-25", completed: 9, failed: 0 },
  { date: "2024-04-26", completed: 5, failed: 0 },
  { date: "2024-04-27", completed: 14, failed: 1 },
  { date: "2024-04-28", completed: 6, failed: 0 },
  { date: "2024-04-29", completed: 11, failed: 0 },
  { date: "2024-04-30", completed: 15, failed: 1 },
  { date: "2024-05-01", completed: 8, failed: 0 },
  { date: "2024-05-02", completed: 12, failed: 1 },
  { date: "2024-05-03", completed: 9, failed: 0 },
  { date: "2024-05-04", completed: 14, failed: 1 },
  { date: "2024-05-05", completed: 16, failed: 0 },
  { date: "2024-05-06", completed: 18, failed: 2 },
  { date: "2024-05-07", completed: 13, failed: 0 },
  { date: "2024-05-08", completed: 7, failed: 0 },
  { date: "2024-05-09", completed: 8, failed: 1 },
  { date: "2024-05-10", completed: 12, failed: 0 },
  { date: "2024-05-11", completed: 11, failed: 0 },
  { date: "2024-05-12", completed: 9, failed: 0 },
  { date: "2024-05-13", completed: 7, failed: 0 },
  { date: "2024-05-14", completed: 16, failed: 1 },
  { date: "2024-05-15", completed: 15, failed: 0 },
  { date: "2024-05-16", completed: 14, failed: 1 },
  { date: "2024-05-17", completed: 17, failed: 0 },
  { date: "2024-05-18", completed: 12, failed: 1 },
  { date: "2024-05-19", completed: 8, failed: 0 },
  { date: "2024-05-20", completed: 9, failed: 0 },
  { date: "2024-05-21", completed: 5, failed: 0 },
  { date: "2024-05-22", completed: 4, failed: 0 },
  { date: "2024-05-23", completed: 11, failed: 1 },
  { date: "2024-05-24", completed: 10, failed: 0 },
  { date: "2024-05-25", completed: 9, failed: 0 },
  { date: "2024-05-26", completed: 7, failed: 0 },
  { date: "2024-05-27", completed: 15, failed: 1 },
  { date: "2024-05-28", completed: 8, failed: 0 },
  { date: "2024-05-29", completed: 5, failed: 0 },
  { date: "2024-05-30", completed: 12, failed: 1 },
  { date: "2024-05-31", completed: 8, failed: 0 },
  { date: "2024-06-01", completed: 9, failed: 0 },
  { date: "2024-06-02", completed: 16, failed: 1 },
  { date: "2024-06-03", completed: 6, failed: 0 },
  { date: "2024-06-04", completed: 15, failed: 0 },
  { date: "2024-06-05", completed: 5, failed: 0 },
  { date: "2024-06-06", completed: 10, failed: 1 },
  { date: "2024-06-07", completed: 13, failed: 0 },
  { date: "2024-06-08", completed: 12, failed: 1 },
  { date: "2024-06-09", completed: 16, failed: 0 },
  { date: "2024-06-10", completed: 7, failed: 0 },
  { date: "2024-06-11", completed: 6, failed: 0 },
  { date: "2024-06-12", completed: 17, failed: 2 },
  { date: "2024-06-13", completed: 5, failed: 0 },
  { date: "2024-06-14", completed: 14, failed: 1 },
  { date: "2024-06-15", completed: 11, failed: 0 },
  { date: "2024-06-16", completed: 12, failed: 1 },
  { date: "2024-06-17", completed: 16, failed: 0 },
  { date: "2024-06-18", completed: 6, failed: 0 },
  { date: "2024-06-19", completed: 13, failed: 1 },
  { date: "2024-06-20", completed: 15, failed: 0 },
  { date: "2024-06-21", completed: 8, failed: 0 },
  { date: "2024-06-22", completed: 11, failed: 1 },
  { date: "2024-06-23", completed: 18, failed: 0 },
  { date: "2024-06-24", completed: 7, failed: 0 },
  { date: "2024-06-25", completed: 6, failed: 0 },
  { date: "2024-06-26", completed: 14, failed: 1 },
  { date: "2024-06-27", completed: 16, failed: 0 },
  { date: "2024-06-28", completed: 8, failed: 0 },
  { date: "2024-06-29", completed: 6, failed: 0 },
  { date: "2024-06-30", completed: 15, failed: 1 },
]

const chartConfig = {
  transcriptions: {
    label: "Transcriptions",
  },
  completed: {
    label: "Completed",
    color: "var(--primary)",
  },
  failed: {
    label: "Failed",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

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
        <CardTitle>Transcription Activity</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Completed and failed transcriptions over time
          </span>
          <span className="@[540px]/card:hidden">Transcription metrics</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
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
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-completed)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-completed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillFailed" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-failed)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-failed)"
                  stopOpacity={0.1}
                />
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
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="failed"
              type="natural"
              fill="url(#fillFailed)"
              stroke="var(--color-failed)"
              stackId="a"
            />
            <Area
              dataKey="completed"
              type="natural"
              fill="url(#fillCompleted)"
              stroke="var(--color-completed)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
