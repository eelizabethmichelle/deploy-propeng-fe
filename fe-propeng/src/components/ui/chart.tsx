"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = { config: ChartConfig }
const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error("useChart must be inside <ChartContainer>")
  return ctx
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId().replace(/:/g, "")
  const chartId = `chart-${id ?? uniqueId}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs " +
            "[&_ .recharts-cartesian-grid_line]:stroke-border/50 " +
            "[&_ .recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

// inject CSS variables for your color/theme
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const entries = Object.entries(config).filter(([, c]) => c.color || c.theme)
  if (!entries.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => {
            const lines = entries
              .map(([key, c]) => {
                const col =
                  c.color ?? (c.theme ? c.theme[theme as keyof typeof THEMES] : "")
                return col ? `--color-${key}: ${col};` : null
              })
              .filter(Boolean)
              .join("\n")
            return `
${prefix} [data-chart=${id}] {
${lines}
}`
          })
          .join("\n"),
      }}
    />
  )
}

// Re-export tooltips & legends
export const ChartTooltip = RechartsPrimitive.Tooltip
export const ChartTooltipContent = RechartsPrimitive.Tooltip
export const ChartLegend = RechartsPrimitive.Legend
export const ChartLegendContent = React.forwardRef<any, any>((p, r) => (
  <RechartsPrimitive.Legend {...p} ref={r} />
))

// ————————————————————————————————
// Grade distribution chart component
// ————————————————————————————————
export function GradeDistributionChart({ data }: { data: number[] }) {
  // build 5-point bins up to 100
  const distribution = React.useMemo(() => {
    const step = 5
    const bins: { range: string; count: number }[] = []
    for (let s = 0; s < 100; s += step) {
      bins.push({ range: s === 0 ? `<${s + step}` : `${s + 1}-${s + step}`, count: 0 })
    }
    bins[bins.length - 1].range = `96-100`
    data.forEach((v) => {
      let idx = Math.floor(v / step)
      if (idx >= bins.length) idx = bins.length - 1
      bins[idx].count++
    })
    return bins
  }, [data])

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Persebaran Nilai Siswa</h2>
      <ChartContainer config={{ count: { color: "#1e40af" } }}>
        <RechartsPrimitive.BarChart
          data={distribution}
          margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
        >
          <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <RechartsPrimitive.XAxis dataKey="range" />
          <RechartsPrimitive.YAxis allowDecimals={false} />
          <RechartsPrimitive.Tooltip content={<ChartTooltipContent />} />
          <RechartsPrimitive.Bar dataKey="count" fill="var(--color-count)" />
        </RechartsPrimitive.BarChart>
      </ChartContainer>
    </div>
  )
}
export default GradeDistributionChart
