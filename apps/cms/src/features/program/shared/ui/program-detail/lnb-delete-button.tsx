/** 프로그램 상세 LNB 좌측 하단 — 프로그램 삭제 (팝업은 목록 단건 삭제와 동일) */

import './lnb-delete-button.css'

export interface ProgramDetailLnbDeleteButtonProps {
  onClick: () => void
}

export function ProgramDetailLnbDeleteButton({ onClick }: ProgramDetailLnbDeleteButtonProps) {
  return (
    <div className="program-detail-lnb-delete">
      <button type="button" className="program-detail-lnb-delete__button" onClick={onClick}>
        프로그램 삭제
      </button>
    </div>
  )
}
