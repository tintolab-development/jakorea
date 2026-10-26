import { formatKoreanPhoneNumberPreservingMask } from '@jakorea/domain/shared/korean-phone'
import type { ApplyTrainedTeachersBasicInfoValues } from './apply-trained-teachers-basic-info'

/** 포털 프로필에서 기본정보에 미리 넣을 수 있는 값 */
export type TrainedTeachersProfileSource = {
  schoolName?: string
  affiliationName?: string
  addressDetail?: string
  regionSido?: string
  regionSigungu?: string
  name?: string
  phone?: string
  email?: string
  teacherOrganization?: {
    organizationName?: string
    address?: string
    addressDetail?: string
    regionSido?: string
    regionSigungu?: string
  }
}

export type TrainedTeachersProfileDefaults = Pick<
  ApplyTrainedTeachersBasicInfoValues,
  | 'schoolName'
  | 'regionLabel'
  | 'addressDetail'
  | 'teacherName'
  | 'teacherMobile'
  | 'teacherEmail'
>

const PROFILE_FILL_KEYS = [
  'schoolName',
  'regionLabel',
  'addressDetail',
  'teacherName',
  'teacherMobile',
  'teacherEmail',
] as const satisfies ReadonlyArray<keyof TrainedTeachersProfileDefaults>

function joinParts(parts: Array<string | undefined>): string {
  return parts
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ')
}

/** 기관 등록 주소. 학교 조직 주소를 우선하고, 없으면 시·도/시·군·구로 채운다. */
export function institutionRegionLabelFromProfile(profile: TrainedTeachersProfileSource): string {
  const org = profile.teacherOrganization
  const orgAddress = org?.address?.trim()
  if (orgAddress) return orgAddress
  const orgRegion = joinParts([org?.regionSido, org?.regionSigungu])
  if (orgRegion) return orgRegion
  return joinParts([profile.regionSido, profile.regionSigungu])
}

export function trainedTeachersProfileDefaults(
  profile: TrainedTeachersProfileSource | null | undefined,
): TrainedTeachersProfileDefaults {
  const source = profile ?? {}
  const org = source.teacherOrganization
  return {
    schoolName:
      source.schoolName?.trim() ||
      source.affiliationName?.trim() ||
      org?.organizationName?.trim() ||
      '',
    regionLabel: institutionRegionLabelFromProfile(source),
    addressDetail: org?.addressDetail?.trim() || source.addressDetail?.trim() || '',
    teacherName: source.name?.trim() || '',
    teacherMobile: formatKoreanPhoneNumberPreservingMask(source.phone ?? ''),
    teacherEmail: source.email?.trim() || '',
  }
}

/** 사용자가 비워 둔 칸만 프로필 값으로 채운다. 이미 입력한 값은 유지한다. */
export function fillTrainedTeachersBasicInfoFromProfile(
  current: ApplyTrainedTeachersBasicInfoValues,
  defaults: TrainedTeachersProfileDefaults,
): ApplyTrainedTeachersBasicInfoValues {
  let changed = false
  const next = { ...current }
  for (const key of PROFILE_FILL_KEYS) {
    if (!next[key].trim() && defaults[key].trim()) {
      next[key] = defaults[key]
      changed = true
    }
  }
  return changed ? next : current
}
