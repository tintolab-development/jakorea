import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

/**
 * 프로그램 등록 위저드(일반·1사1교·UJAT·교육받은 교사) 공통 정보 — 섹션 제목 번호(「1.」~「N.」)를 표시하지 않는다.
 * 저장·임시 저장에 쓰는 draft는 그대로 두고, 위저드 좌측 패널에 넘기는 표시용 vm만 바꾼다.
 */
export function withRegistrationWizardTitleNumberingOff<V extends { draft: WritingFormDraft }>(
  vm: V
): V {
  if (vm.draft.formSettings.titleNumbering === 'none') return vm
  return {
    ...vm,
    draft: {
      ...vm.draft,
      formSettings: { ...vm.draft.formSettings, titleNumbering: 'none' },
    },
  }
}
