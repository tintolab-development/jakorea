import { getUjatVolunteerPreferredRegionLabels } from '@/features/program/ujat/lib/ujat-education-regions'
import { resolveUjatRegistrationBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import {
  type UjatRegionCapacityBySemesterState,
  type UjatRegionCapacityField,
  type UjatRegionCapacityRegionName,
  type UjatRegionCapacitySemesterKey,
  type UjatRegionCapacitySemesterValues,
  UJAT_REGION_CAPACITY_OVERLAY_KEY,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { formatNumberDisplay } from '@/shared/utils'

// 버그 수정: 신규 등록 폼 진입 시 지역별 학급·봉사단 수에 목업 숫자가 미리 채워져
// 노출되던 문제 — 기본값은 빈 값으로 두고, 실제 사용자가 입력한 값만 반영한다.
function buildDefaultSemesterValues(): UjatRegionCapacitySemesterValues {
  const labels = getUjatVolunteerPreferredRegionLabels()
  return Object.fromEntries(
    labels.map(label => [
      label,
      {
        classCount: '',
        volunteerCount: '',
      },
    ])
  ) as UjatRegionCapacitySemesterValues
}

function readLegacySemester(
  legacy: UjatRegionCapacitySemesterValues | undefined
): UjatRegionCapacitySemesterValues {
  return legacy ?? {}
}

function readCapacityState(overlay: Record<string, unknown>): UjatRegionCapacityBySemesterState {
  const raw = overlay[UJAT_REGION_CAPACITY_OVERLAY_KEY]
  if (!raw || typeof raw !== 'object') {
    return {
      h1: buildDefaultSemesterValues(),
      h2: buildDefaultSemesterValues(),
    }
  }
  const o = raw as Partial<UjatRegionCapacityBySemesterState> & {
    first?: UjatRegionCapacitySemesterValues
    second?: UjatRegionCapacitySemesterValues
  }
  const h1 = { ...buildDefaultSemesterValues(), ...readLegacySemester(o.h1 ?? o.first) }
  const h2 = { ...buildDefaultSemesterValues(), ...readLegacySemester(o.h2 ?? o.second) }
  return { h1, h2 }
}

export function resolveUjatRegionCapacitySemesterValues(
  half: UjatRegionCapacitySemesterKey,
  overlayInput?: Record<string, unknown>
): UjatRegionCapacitySemesterValues {
  const overlay = overlayInput ?? resolveUjatRegistrationBasicInfoOverlay()
  return readCapacityState(overlay)[half]
}

export function resolveUjatRegionCapacityBySemester(
  overlayInput?: Record<string, unknown>
): UjatRegionCapacityBySemesterState {
  const overlay = overlayInput ?? resolveUjatRegistrationBasicInfoOverlay()
  return readCapacityState(overlay)
}

export function formatUjatRegionCapacityClassView(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return '-'
  const formatted = formatNumberDisplay(trimmed)
  return formatted === '-' ? '-' : `${formatted}개 학급`
}

export function formatUjatRegionCapacityVolunteerView(value: string | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) return '-'
  const formatted = formatNumberDisplay(trimmed)
  return formatted === '-' ? '-' : `${formatted}명`
}

export function formatUjatRegionCapacityRegionView(
  values: UjatRegionCapacitySemesterValues[UjatRegionCapacityRegionName] | undefined
): string {
  if (!values?.classCount?.trim() && !values?.volunteerCount?.trim()) return '-'
  return `${formatUjatRegionCapacityClassView(values?.classCount)} · ${formatUjatRegionCapacityVolunteerView(values?.volunteerCount)}`
}

export function buildUjatRegionCapacityOverlayDefaults(): Record<string, unknown> {
  return {
    [UJAT_REGION_CAPACITY_OVERLAY_KEY]: {
      h1: buildDefaultSemesterValues(),
      h2: buildDefaultSemesterValues(),
    } satisfies UjatRegionCapacityBySemesterState,
  }
}

export function parseUjatRegionCapacityNumericInput(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function readUjatRegionCapacityField(
  values: UjatRegionCapacitySemesterValues,
  region: UjatRegionCapacityRegionName,
  field: UjatRegionCapacityField
): string {
  return values[region]?.[field] ?? ''
}
