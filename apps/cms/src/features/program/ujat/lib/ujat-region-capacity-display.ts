import {
  getUjatVolunteerPreferredRegionLabels,
  UJAT_DEFAULT_EDUCATION_REGIONS,
} from '@/features/program/ujat/lib/ujat-education-regions'
import { resolveUjatRegistrationBasicInfoOverlay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import {
  type UjatRegionCapacityBySemesterState,
  type UjatRegionCapacityField,
  type UjatRegionCapacityRegionName,
  type UjatRegionCapacitySemesterKey,
  type UjatRegionCapacitySemesterValues,
  UJAT_REGION_CAPACITY_OVERLAY_KEY,
} from '@/features/program/ujat/lib/ujat-region-capacity-types'

const DEFAULT_CLASS_COUNTS: Record<string, string> = Object.fromEntries(
  UJAT_DEFAULT_EDUCATION_REGIONS.map(row => {
    const counts: Record<string, string> = {
      서울: '50',
      '경기(남부)': '60',
      인천: '40',
      대전: '46',
      대구: '52',
      부산: '54',
      광주: '46',
      '전북(전주)': '44',
    }
    return [row.label, counts[row.label] ?? '']
  })
)

const DEFAULT_VOLUNTEER_COUNTS: Record<string, string> = { ...DEFAULT_CLASS_COUNTS }

function buildDefaultSemesterValues(): UjatRegionCapacitySemesterValues {
  const labels = getUjatVolunteerPreferredRegionLabels()
  return Object.fromEntries(
    labels.map(label => [
      label,
      {
        classCount: DEFAULT_CLASS_COUNTS[label] ?? '',
        volunteerCount: DEFAULT_VOLUNTEER_COUNTS[label] ?? '',
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
  return trimmed ? `${trimmed}개 학급` : '-'
}

export function formatUjatRegionCapacityVolunteerView(value: string | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? `${trimmed}명` : '-'
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
