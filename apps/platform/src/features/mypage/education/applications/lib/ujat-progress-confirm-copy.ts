/**
 * UJAT 교육 진행 정보 확인 1/2 — Figma `11001:220293` 텍스트 SSOT.
 * 제목 번호는 ParagraphInput `titleLeading`으로 분리한다.
 */
export const UJAT_PROGRESS_CONFIRM_COPY = {
  pageTitle: '교육 진행 정보 확인하기',
  pageTitleRevision: '교육 진행 정보 수정하기',
  step: '1 / 2',
  backLabel: '이전으로',
  temporarySchedule: {
    title: '관리자 배정 일정',
    description: '관리자가 배정한 교육 일정입니다. 신청 당시 희망 일정과 다를 수 있습니다.',
  },
  basicInfo: {
    leading: '1. ',
    title: '기본 정보',
    description: '',
  },
  gradeInfo: {
    leading: '2. ',
    title: '학년 별 신청 정보',
    description: '신청 학년 별 학급 수 및 학생 수를 작성해 주세요.',
    addButton: '신청 학년 추가',
  },
  classTime: {
    leading: '3. ',
    title: '학년 별 수업 시간',
    description: '신청 학년 별 수업 진행 시간을 작성해 주세요.',
    addButton: '수업 진행 시간 추가',
  },
  preferredSchedule: {
    leading: '4. ',
    title: '진행 희망 교육 일정',
    description:
      '금요일 1교시~4교시에 진행되며, 4교시 모두 교육 진행이 가능해야 합니다. * 참여 가능한 모든 일정을 선택해 주시면, 선택해 주신 일정 중에서 조정하여 교육이 진행될 예정입니다.',
    summaryLabel: '교육 진행 희망일',
  },
  confirm: {
    leading: '5. ',
    title: '상기 내용을 모두 확인하였으며 현재 답변으로 제출합니다.',
    description:
      '교육 일정과 학년 정보는 담당자와 협의된 내용으로 작성되어야 하며, 협의사항과 다를 경우 담당자가 수정 요청을 드릴 수 있습니다.',
    radioLabel: '네. 상기 내용 모두 확인하였으며, 해당 내용으로 교육을 진행합니다.',
  },
  cta: {
    continue: '안내사항 작성하기',
    continueRevision: '안내사항 수정하기',
    saving: '저장 중…',
  },
} as const
