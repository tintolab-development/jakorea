import type { TooltipProps } from 'recharts'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SurveyScaleChartDatum } from '../../lib/survey-management/aggregate-survey-poll-results'
import './survey-management.css'

type SurveyScaleResultChartProps = {
  data: SurveyScaleChartDatum[]
}

function ScaleChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || payload == null || payload.length === 0) return null
  const datum = payload[0]?.payload as SurveyScaleChartDatum | undefined
  if (datum == null) return null

  return (
    <div className="ujat-survey-scale-chart__tooltip">
      <p className="ujat-survey-scale-chart__tooltip-label">{datum.label}</p>
      <p className="ujat-survey-scale-chart__tooltip-value">Total : {datum.count}</p>
    </div>
  )
}

export function SurveyScaleResultChart({ data }: SurveyScaleResultChartProps) {
  const maxCount = Math.max(...data.map(item => item.count), 1)

  return (
    <div className="ujat-survey-scale-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
          barCategoryGap={20}
        >
          <CartesianGrid vertical={false} stroke="#E0E0E0" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#767676', fontSize: 12 }}
            axisLine={{ stroke: '#E0E0E0' }}
            tickLine={false}
            interval={0}
            height={48}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, maxCount <= 5 ? 5 : maxCount + 1]}
            tick={{ fill: '#767676', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip cursor={{ fill: 'rgba(1, 161, 175, 0.08)' }} content={<ScaleChartTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={100} maxBarSize={100}>
            {data.map(entry => (
              <Cell key={entry.itemId} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
