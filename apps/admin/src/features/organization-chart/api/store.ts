/**
 * 조직도 관리 — localStorage mock (API 연동 전)
 */

import type {
  OrganizationChartInfo,
  OrganizationChartSaveInput,
} from '@/entities/organization-chart/model/types'
import orgChartImage from '@/assets/images/organization/org-chart.png'

const STORAGE_KEY = 'admin.jakorea.organization-chart.v1'

export const ORGANIZATION_CHART_CHANGED_EVENT = 'jakorea:organization-chart-changed' as const

type OrganizationChartFile = {
  version: 1
  data: OrganizationChartInfo
}

function buildSeedOrganizationChart(): OrganizationChartInfo {
  return {
    mainTitle: '청소년들의 미래를 위해 JA Korea와 함께하는 사람들',
    imageUrl: orgChartImage,
    imageFileName: 'org-chart.png',
    updatedAt: '2026-07-01T00:00:00.000Z',
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeOrganizationChart(
  raw: Partial<OrganizationChartInfo> | null | undefined
): OrganizationChartInfo {
  const seed = buildSeedOrganizationChart()
  if (!raw || typeof raw !== 'object') return seed
  return {
    mainTitle: asString(raw.mainTitle, seed.mainTitle),
    imageUrl: asString(raw.imageUrl, seed.imageUrl),
    imageFileName:
      typeof raw.imageFileName === 'string' ? raw.imageFileName : seed.imageFileName,
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readOrganizationChartFile(): OrganizationChartFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeedOrganizationChart() }
    const parsed = JSON.parse(raw) as OrganizationChartFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedOrganizationChart() }
    }
    return { version: 1, data: normalizeOrganizationChart(parsed.data) }
  } catch {
    return { version: 1, data: buildSeedOrganizationChart() }
  }
}

function writeOrganizationChartFile(file: OrganizationChartFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(ORGANIZATION_CHART_CHANGED_EVENT))
}

export function readOrganizationChart(): OrganizationChartInfo {
  const file = readOrganizationChartFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeOrganizationChartFile(file)
  }
  return file.data
}

export function saveOrganizationChart(
  input: OrganizationChartSaveInput
): OrganizationChartInfo {
  const next = normalizeOrganizationChart({
    mainTitle: input.mainTitle.trim(),
    imageUrl: input.imageUrl.trim(),
    imageFileName: input.imageFileName?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  })
  writeOrganizationChartFile({ version: 1, data: next })
  return next
}
