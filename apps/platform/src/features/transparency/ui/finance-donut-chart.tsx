import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useMediaQuery } from '@/shared/hooks'
import { platformMediaQueries } from '@/shared/lib'
import { PFText } from '@/shared/ui'
import { formatKrwAmount } from '../lib/mock-data'
import type { FinanceSlice, FinanceSummary } from '../model/types'
import styles from './finance-donut-chart.module.css'

type FinanceDonutChartProps = {
  summary: FinanceSummary
  /**
   * SVG 전체 높이(콜아웃 포함).
   * 도넛 본체는 시안 기준 544×543 — outerRadius로 고정.
   */
  height?: number
  ariaLabel: string
}

const RADIAN = Math.PI / 180
/** Figma 도넛 본체 544×543.098 → 직경 544 */
const PIE_SIZE = 544
const OUTER_RADIUS = PIE_SIZE / 2
/** 시안 링 두께 56px */
const RING_THICKNESS = 56
const INNER_RADIUS = OUTER_RADIUS - RING_THICKNESS
/** 모바일: 좁은 폭에 맞춤 · 두께는 반경 비율로 축소 */
const MOBILE_OUTER_RADIUS = 148
/** 세그먼트 중앙각에서 링 바깥으로 뻗는 짧은 방사형 구간 길이 */
const RADIAL_LEN = 28
/** 도넛 외곽과 라벨 수평선(레일) 사이 최소 여백 */
const RAIL_GAP = 44
/** 수평 선(타이틀·수치 기준선) 길이 */
const H_LINE = 220
/** 인접 라벨 간 최소 세로 간격 (타이틀 + 수치 2줄 높이) */
const MIN_LABEL_GAP = 80
/** 라벨 텍스트와 도넛 사이 최소 가로 여백 */
const TEXT_CLEARANCE = 16
/** 퍼센트 ↔ 금액 tspan 간격 (dx) */
const VALUE_TSPAN_GAP = 12
/** 콜아웃 여백을 포함한 기본 SVG 높이 */
const DEFAULT_CHART_HEIGHT = 700
const MOBILE_CHART_HEIGHT = 320

/**
 * SVG 텍스트는 렌더 전 측정이 어려워 문자 클래스 기반으로 폭을 추정한다.
 * (Pretendard 기준 근사치 — 숫자 0.6em, 구두점 0.3em, %, 전각 문자 등)
 */
function estimateTextWidth(text: string, fontSize: number) {
  let width = 0
  for (const ch of text) {
    if (ch === '.' || ch === ',') width += fontSize * 0.3
    else if (ch === '%') width += fontSize * 0.95
    else if (ch >= '0' && ch <= '9') width += fontSize * 0.62
    else if (ch === ' ') width += fontSize * 0.28
    else width += fontSize // 한글 등 전각 문자
  }
  return width
}

type CalloutRenderProps = {
  cx?: number
  cy?: number
  midAngle?: number
  outerRadius?: number
  index?: number
}

type CalloutLayout = {
  /** 세그먼트 중앙각 기준 라우팅 방향 */
  side: 'left' | 'right'
  /** cy 기준 라벨 수평선 Y 오프셋 (겹침 해소 후) */
  labelYRel: number
}

export function FinanceDonutChart({
  summary,
  height = DEFAULT_CHART_HEIGHT,
  ariaLabel,
}: FinanceDonutChartProps) {
  const isBelowPc = useMediaQuery(platformMediaQueries.belowPc)
  const pieOuterRadius = isBelowPc ? '88%' : OUTER_RADIUS
  const pieInnerRadius = isBelowPc ? '70%' : INNER_RADIUS
  const layoutRadius = isBelowPc ? MOBILE_OUTER_RADIUS : OUTER_RADIUS
  const chartHeight = isBelowPc ? MOBILE_CHART_HEIGHT : height

  const { slices, totalAmount, totalLabel } = summary

  const chartData = useMemo(
    () =>
      slices.map(slice => ({
        name: slice.label,
        value: Number(slice.percent),
      })),
    [slices]
  )

  /**
   * 콜아웃 레이아웃 — 데이터에서 각 세그먼트의 실제 중앙각을 계산해
   * 1) 중앙각의 화면 X 방향으로 좌/우 라우팅을 결정하고
   * 2) 같은 쪽 라벨끼리는 화면 Y 순서대로 최소 간격을 보장한다.
   *    (희망 Y = 중앙각 방사선이 링 밖으로 나온 지점 → 겹치면 아래로 밀어냄)
   * 비율이 바뀌면 중앙각·희망 Y가 함께 바뀌므로 선 위치가 자동 추종된다.
   */
  const calloutLayouts = useMemo(() => {
    const total = slices.reduce((sum, slice) => sum + Number(slice.percent), 0)
    const layouts = new Map<string, CalloutLayout>()
    if (total <= 0) return layouts

    const items = slices.reduce<
      Array<{ id: string; side: 'left' | 'right'; desiredY: number; endAngle: number }>
    >((acc, slice) => {
      const startAngle = acc.length === 0 ? 0 : acc[acc.length - 1]!.endAngle
      const sweep = (Number(slice.percent) / total) * 360
      const midAngle = 90 - startAngle - sweep / 2

      // recharts 좌표계: x = cx + r·cos(-θ), y = cy + r·sin(-θ)
      const dx = Math.cos(RADIAN * midAngle)
      const dy = -Math.sin(RADIAN * midAngle)
      acc.push({
        id: slice.id,
        side: dx >= 0 ? 'right' : 'left',
        desiredY: dy * (layoutRadius + RADIAL_LEN),
        endAngle: startAngle + sweep,
      })
      return acc
    }, [])

    for (const side of ['left', 'right'] as const) {
      const group = items
        .filter(item => item.side === side)
        .sort((a, b) => a.desiredY - b.desiredY)

      let prevY = Number.NEGATIVE_INFINITY
      for (const item of group) {
        const labelYRel = Math.max(item.desiredY, prevY + MIN_LABEL_GAP)
        prevY = labelYRel
        layouts.set(item.id, { side, labelYRel })
      }
    }
    return layouts
  }, [slices, layoutRadius])

  const renderCallout = (props: CalloutRenderProps) => {
    if (isBelowPc) return null

    const cx = Number(props.cx ?? 0)
    const cy = Number(props.cy ?? 0)
    const midAngle = Number(props.midAngle ?? 0)
    const outerRadius = Number(props.outerRadius ?? pieOuterRadius)
    const index = props.index ?? 0

    const slice = slices[index]
    if (!slice) return null

    const layout = calloutLayouts.get(slice.id)
    if (!layout) return null

    // 세그먼트 실제 중앙각(recharts가 넘겨주는 값) 기준 화면 방향 벡터
    const dx = Math.cos(RADIAN * midAngle)
    const dy = -Math.sin(RADIAN * midAngle)

    // 1) 링 외곽 접점 — 세그먼트 호의 정확한 중앙 위치
    const anchorX = cx + (outerRadius + 2) * dx
    const anchorY = cy + (outerRadius + 2) * dy
    // 2) 짧은 방사형 구간의 끝(엘보)
    const elbowX = cx + (outerRadius + RADIAL_LEN) * dx
    const elbowY = cy + (outerRadius + RADIAL_LEN) * dy

    // 3) 라벨 수평선(레일) — 겹침 해소된 Y + 도넛 바깥으로 보장된 X
    const isRight = layout.side === 'right'
    const labelY = cy + layout.labelYRel
    const railInnerX = isRight
      ? Math.max(elbowX + 8, cx + outerRadius + RAIL_GAP)
      : Math.min(elbowX - 8, cx - outerRadius - RAIL_GAP)

    // 4) 텍스트 폭 추정 — 타이틀(20px) vs 퍼센트+금액(24px) 중 넓은 쪽
    const valueLineWidth =
      estimateTextWidth(`${slice.percent}%`, 24) +
      VALUE_TSPAN_GAP +
      estimateTextWidth(formatKrwAmount(slice.amount), 24)
    const textWidth = Math.max(estimateTextWidth(slice.label, 20), valueLineWidth)

    // 5) 라벨 세로 밴드(타이틀~수치)에서 도넛이 차지하는 최대 가로 반폭.
    //    라벨이 도넛 위/아래 바깥이면 0 — 기존 레이아웃 그대로 유지된다.
    const bandNearY = Math.min(Math.max(cy, labelY - 30), labelY + 36)
    const ringReach = outerRadius + 8
    const bandDy = bandNearY - cy
    const donutHalfWidth =
      Math.abs(bandDy) >= ringReach
        ? 0
        : Math.sqrt(ringReach * ringReach - bandDy * bandDy)

    // 6) 텍스트가 도넛과 겹치지 않도록 레일 바깥 끝을 필요한 만큼 연장
    const railOuterX = isRight
      ? Math.max(
          railInnerX + H_LINE,
          cx + donutHalfWidth + TEXT_CLEARANCE + textWidth
        )
      : Math.min(
          railInnerX - H_LINE,
          cx - donutHalfWidth - TEXT_CLEARANCE - textWidth
        )

    // 텍스트는 레일 바깥쪽 끝에 정렬 (우측 → 오른끝, 좌측 → 왼끝)
    const textX = railOuterX
    const textAnchor = isRight ? 'end' : 'start'

    return (
      <g className={styles.callout}>
        <polyline
          points={`${anchorX},${anchorY} ${elbowX},${elbowY} ${railInnerX},${labelY} ${railOuterX},${labelY}`}
          fill="none"
          stroke={slice.color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <text
          x={textX}
          y={labelY - 10}
          textAnchor={textAnchor}
          className={styles.calloutName}
        >
          {slice.label}
        </text>
        <text x={textX} y={labelY + 28} textAnchor={textAnchor}>
          <tspan className={styles.calloutPercent}>{slice.percent}%</tspan>
          <tspan dx={12} className={styles.calloutAmount}>
            {formatKrwAmount(slice.amount)}
          </tspan>
        </text>
      </g>
    )
  }

  return (
    <figure className={styles.chart} aria-label={ariaLabel}>
      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart style={{ outline: 'none' }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              startAngle={90}
              endAngle={-270}
              innerRadius={pieInnerRadius}
              outerRadius={pieOuterRadius}
              isAnimationActive={false}
              labelLine={false}
              label={renderCallout}
              stroke="none"
              style={{ outline: 'none', cursor: 'default' }}
            >
              {slices.map(slice => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className={styles.center} aria-hidden="true">
          <strong className={styles.centerTotal}>
            {totalAmount.toLocaleString('ko-KR')}
          </strong>
          <span className={styles.centerLabel}>{totalLabel}</span>
        </div>
      </div>

      <ul className={styles.legend}>
        {slices.map(slice => (
          <LegendItem key={slice.id} slice={slice} />
        ))}
      </ul>
    </figure>
  )
}

function LegendItem({ slice }: { slice: FinanceSlice }) {
  return (
    <li className={styles.legendItem}>
      <span className={styles.legendDot} style={{ backgroundColor: slice.color }} />
      <PFText typo="bd-md-rg" color="black">
        {slice.label}
      </PFText>
    </li>
  )
}
