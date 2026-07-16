/**
 * 선택 배정 확인 모달 (강사 배정 안내 컨펌)
 * 배정 대기 강사 목록에서 강사 선택 후 "선택 배정" 클릭 시 노출.
 * 스크린샷 스펙: "[강사명] 강사님을 [학교명]에 새로 배정하시겠습니까?" (현재 배정 인원 : n/m명), 취소/강사 배정
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'

const SELECT_ASSIGN_CONFIRM_MODAL_WIDTH = 560

export interface SchoolDetailSelectAssignConfirmModalProps {
  open: boolean
  onCancel: () => void
  /** 배정 대상 기관명 */
  schoolName: string
  /** 선택한 강사명 목록 (배정 대기 목록에서 선택된 행) */
  instructorNames: string[]
  /** 현재 배정된 인원 수 */
  currentCount: number
  /** 필요 배정 인원 수 (분모) */
  requiredCount: number
  /** "강사 배정" 클릭 시 호출 */
  onConfirm: () => void
}

function formatBracketedBoldNames(names: string[]): string {
  return names.map(name => `[**${name}**]`).join(', ')
}

function buildSelectAssignConfirmDescription(
  instructorNames: string[],
  schoolName: string,
  currentCount: number,
  requiredCount: number
): string {
  const mainLine =
    instructorNames.length > 0
      ? `${formatBracketedBoldNames(instructorNames)} 강사님을 [**${schoolName}**]에 새로 배정하시겠습니까?`
      : `[**${schoolName}**]에 새로 배정하시겠습니까?`

  return `${mainLine}\n(현재 배정 인원 : ${currentCount}/${requiredCount}명)`
}

export function SchoolDetailSelectAssignConfirmModal({
  open,
  onCancel,
  schoolName,
  instructorNames,
  currentCount,
  requiredCount,
  onConfirm,
}: SchoolDetailSelectAssignConfirmModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강사 배정 안내"
      width={SELECT_ASSIGN_CONFIRM_MODAL_WIDTH}
      description={buildSelectAssignConfirmDescription(
        instructorNames,
        schoolName,
        currentCount,
        requiredCount
      )}
      footer={
        <>
          <CmsButton variant="secondary" size="medium" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="medium" onClick={onConfirm}>
            강사 배정
          </CmsButton>
        </>
      }
    >
      {null}
    </ContentModal>
  )
}
