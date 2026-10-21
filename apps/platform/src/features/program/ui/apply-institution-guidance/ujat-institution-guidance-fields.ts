import type { InstitutionGuidanceFieldId } from '@jakorea/form-schema/paragraph-ids/program-application-form-institution-draft'

export type UjatSnackAvailability = 'possible' | 'impossible' | ''
export type UjatClassroomSettingConfirmed = 'confirmed' | ''

export type ApplyUjatInstitutionGuidanceExtras = {
  snackAvailability: UjatSnackAvailability
  classroomSettingConfirmed: UjatClassroomSettingConfirmed
}

export const UJAT_INSTITUTION_GUIDANCE_FIELD_COPY: Record<
  InstitutionGuidanceFieldId,
  { title: string; description: string }
> = {
  'computer-in-room': {
    title: '검색 기기 사용 가능 여부 (6학년)',
    description:
      '진행학년이 6학년인 경우 일부 활동에 검색이 필요한 활동이 있습니다. 태블릿 혹은 노트북 사용이 가능한지 확인 부탁드립니다. (ex. 조별 노트북 사용 가능, 인당 태블릿 사용 가능)',
  },
  'waiting-place': {
    title: '대기 장소 안내',
    description:
      '수업시간 30분전 대기장소에 도착할 예정입니다. 대기장소를 상세히 작성해 주세요. (ex. 본관 2층 3학년 연구실) 학년별 대기장소가 다를 시 학년별 대기실 각각 기재해주세요.',
  },
  meal: {
    title: '잔여교재 배출 장소',
    description:
      '교육 종료 후 대기실 정리를 하며 잔여교재 등 쓰레기가 발생합니다. 쓰레기 배출 장소를 작성해주시면 해당 장소로 안내하겠습니다. (ex. 대기실 쓰레기통)',
  },
  'other-notes': {
    title: '기타 특이사항 (주차, 전달사항 등)',
    description: '주차 안내나 기타 전달사항이 있다면 작성해 주세요.',
  },
}

export const UJAT_SNACK_AVAILABILITY_OPTIONS = [
  { value: 'possible', label: '네, 가능합니다.' },
  { value: 'impossible', label: '아니오, 불가능합니다.' },
] as const

export const UJAT_CLASSROOM_SETTING_OPTIONS = [
  { value: 'confirmed', label: '네, 확인했습니다.' },
] as const

export const UJAT_SNACK_FIELD = {
  title: '간식 제공 가능 여부(ABC초콜릿)',
  description: '교육 진행 중 보상용 간식으로 ABC초콜릿을 준비할 예정입니다.',
} as const

export const UJAT_CLASSROOM_SETTING_FIELD = {
  title: '교실 세팅 협조 요청',
  description:
    '선생님들께서 1개 교실에 2명씩(불가피한 경우 1명) 파견될 예정입니다. USB에 PPT를 담아 방문할 예정이오니 세팅에 협조 부탁드립니다.',
} as const

export const UJAT_SEX_OFFENSE_WRITE_HEADING = {
  title: '성범죄경력 조회 동의서 조회 방식',
  description:
    '성범죄경력 조회 동의서의 조회 방식을 선택해 주세요. 범죄경력회보서의 온라인 제출을 희망하는 경우, 기관 ID와 검증번호를 함께 전달해 주세요.\nJA 시스템 내에서 확인 선택 시, 프로그램 및 배정 정보와 함께 JA 홈페이지 상세에서 동의서 확인이 가능합니다. (조회 동의서만 제공하며, 실제 조회는 별도로 진행해 주셔야 합니다.)',
} as const

export function emptyUjatInstitutionGuidanceExtras(): ApplyUjatInstitutionGuidanceExtras {
  return {
    snackAvailability: '',
    classroomSettingConfirmed: '',
  }
}

export function ujatGuidanceExtrasFromDraftAnswer(
  answer: unknown,
): ApplyUjatInstitutionGuidanceExtras {
  const empty = emptyUjatInstitutionGuidanceExtras()
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return empty
  const row = answer as Record<string, unknown>
  const snack =
    row.snackAvailability === 'possible' || row.snackAvailability === 'impossible'
      ? row.snackAvailability
      : ''
  const classroom = row.classroomSettingConfirmed === 'confirmed' ? 'confirmed' : ''
  return { snackAvailability: snack, classroomSettingConfirmed: classroom }
}

export function mergeUjatGuidanceExtrasIntoAnswer(
  answer: Record<string, string>,
  extras: ApplyUjatInstitutionGuidanceExtras,
): Record<string, string> {
  return {
    ...answer,
    snackAvailability: extras.snackAvailability,
    classroomSettingConfirmed: extras.classroomSettingConfirmed,
  }
}

export function findIncompleteUjatInstitutionGuidanceExtrasMessage(
  extras: ApplyUjatInstitutionGuidanceExtras,
): string | null {
  if (extras.snackAvailability !== 'possible' && extras.snackAvailability !== 'impossible') {
    return '간식 제공 가능 여부를 선택해 주세요.'
  }
  if (extras.classroomSettingConfirmed !== 'confirmed') {
    return '교실 세팅 협조 요청을 확인해 주세요.'
  }
  return null
}
