import { useState } from 'react'
import { PermissionModal } from '@/shared/components/permission-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'
import {
  ModalSpecTable,
  ModalSpecTableRow,
} from '@/shared/ui/modal-spec-table/modal-spec-table'
import { DsDemo, DsSection } from './section'

type ProcessModal =
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'assign'
  | 'delete-confirm'
  | 'delete-guide'
  | 'blocked'
  | 'preview'
  | null

const PROCESS_MATRIX = [
  {
    process: '승인',
    component: 'PermissionModal approve',
    size: '600',
    detail: '알림 발송 시점',
  },
  {
    process: '반려',
    component: 'PermissionModal reject',
    size: '600',
    detail: '필수 사유 + 검증',
  },
  {
    process: '취소',
    component: 'PermissionModal notifyBeforeReason',
    size: '600',
    detail: '알림 → 취소 사유',
  },
  {
    process: '배정',
    component: 'ContentModal + ModalSpecTable',
    size: '800',
    detail: '선택·일정·확인',
  },
  {
    process: '삭제',
    component: 'ConfirmModal / DeleteGuideModal',
    size: '600',
    detail: '경고 또는 typed confirm',
  },
  {
    process: '불가',
    component: 'ContentModal compact',
    size: '600',
    detail: '단일 확인',
  },
  {
    process: '미리보기',
    component: 'ContentModal large',
    size: '1400',
    detail: '전체 최대 880 + 본문 스크롤',
  },
] as const

export function ModalProcessSection() {
  const [activeModal, setActiveModal] = useState<ProcessModal>(null)
  const close = () => setActiveModal(null)

  return (
    <DsSection
      id="modal-processes"
      title="Modal processes"
      description="승인·반려·취소·배정·삭제·불가·미리보기의 대표 활성 패턴입니다."
    >
      <p className="ds-note">
        프로세스별 문구와 입력 필드는 달라도 셸·폭·높이·푸터 정렬은 공통 규격을 따릅니다. 아래
        라이브 데모는 실제 공통 컴포넌트 API만 사용합니다.
      </p>

      <DsDemo label="프로세스별 대표 라이브 모달">
        <div className="ds-modal-process-grid">
          <CmsButton variant="primary" onClick={() => setActiveModal('approve')}>
            승인
          </CmsButton>
          <CmsButton variant="delete" onClick={() => setActiveModal('reject')}>
            반려
          </CmsButton>
          <CmsButton variant="secondary" onClick={() => setActiveModal('cancel')}>
            취소
          </CmsButton>
          <CmsButton variant="primary" onClick={() => setActiveModal('assign')}>
            배정
          </CmsButton>
          <CmsButton variant="delete" onClick={() => setActiveModal('delete-confirm')}>
            삭제 확인
          </CmsButton>
          <CmsButton variant="delete" onClick={() => setActiveModal('delete-guide')}>
            삭제 안내
          </CmsButton>
          <CmsButton variant="default" onClick={() => setActiveModal('blocked')}>
            작업 불가
          </CmsButton>
          <CmsButton variant="secondary" onClick={() => setActiveModal('preview')}>
            1400×최대 880 미리보기
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="프로세스·컴포넌트 매트릭스">
        <ModalSpecTable aria-label="모달 프로세스 매트릭스">
          {PROCESS_MATRIX.map(row => (
            <ModalSpecTableRow key={row.process} label={row.process} labelVariant="basis">
              <div className="ds-modal-matrix-value">
                <code>{row.component}</code>
                <span>{row.size}px</span>
                <span>{row.detail}</span>
              </div>
            </ModalSpecTableRow>
          ))}
        </ModalSpecTable>
      </DsDemo>

      <p className="ds-note">
        <strong>활성 예외</strong> — 완료 결과 420px, blocked 480px, 개인정보 520px, 학교 배정
        560px, 일정 수정 760px과 일부 고정 높이는 기존 화면 호환용입니다. 신규 모달에는 공식
        600/800/1000/1200/1400 티어를 사용합니다. API·탭·문서 뷰어 의존성이 큰 도메인 모달은
        이 대표 셸로 카탈로그합니다.
      </p>

      <PermissionModal
        open={activeModal === 'approve'}
        onCancel={close}
        onConfirm={close}
        variant="approve"
        title="승인"
        message="선택한 항목을 **승인**합니다.\n알림 발송 시점을 선택해 주세요."
      />

      <PermissionModal
        open={activeModal === 'reject'}
        onCancel={close}
        onConfirm={close}
        variant="reject"
        title="반려"
        message="선택한 항목을 **반려**합니다.\n반려 사유를 입력해 주세요."
      />

      <PermissionModal
        open={activeModal === 'cancel'}
        onCancel={close}
        onConfirm={close}
        variant="reject"
        title="승인 취소"
        message="선택한 항목의 승인을 취소합니다."
        confirmLabel="승인 취소"
        confirmVariant="delete"
        reasonLabel="취소 사유"
        reasonPlaceholder="취소 사유를 입력해 주세요."
        reasonRequiredMessage="취소 사유를 입력해 주세요."
        notifyBeforeReason
      />

      <ContentModal
        open={activeModal === 'assign'}
        onCancel={close}
        title="교육 배정"
        size="default"
        description="선택한 기관에 담당 강사와 교육 일정을 배정합니다."
        footer={
          <>
            <CmsButton variant="secondary" onClick={close}>
              취소
            </CmsButton>
            <CmsButton variant="primary" onClick={close}>
              배정
            </CmsButton>
          </>
        }
      >
        <ModalSpecTable aria-label="교육 배정 정보">
          <ModalSpecTableRow label="기관" labelVariant="basis">
            JA Korea 데모 기관
          </ModalSpecTableRow>
          <ModalSpecTableRow label="담당 강사" labelVariant="basis">
            홍길동 강사
          </ModalSpecTableRow>
          <ModalSpecTableRow label="교육 일정" labelVariant="basis">
            2026.07.21 10:00–12:00
          </ModalSpecTableRow>
        </ModalSpecTable>
      </ContentModal>

      <ConfirmModal
        open={activeModal === 'delete-confirm'}
        title="삭제하시겠습니까?"
        content="선택한 항목을 삭제합니다."
        warningMessage="삭제된 항목은 복구할 수 없습니다."
        confirmText="삭제"
        danger
        onCancel={close}
        onConfirm={close}
      />

      <DeleteGuideModal
        open={activeModal === 'delete-guide'}
        onCancel={close}
        onConfirm={close}
        title="삭제 안내"
        lines={['선택한 항목 **[데모 항목]** 을 삭제합니다.', '삭제된 항목은 복구할 수 없습니다.']}
      />

      <ContentModal
        open={activeModal === 'blocked'}
        onCancel={close}
        title="작업 불가 안내"
        size="compact"
        description="연결된 사용 내역이 있어 현재 항목을 삭제할 수 없습니다."
        footer={
          <CmsButton variant="primary" onClick={close}>
            확인
          </CmsButton>
        }
      >
        <div />
      </ContentModal>

      <ContentModal
        open={activeModal === 'preview'}
        onCancel={close}
        title="문서 미리보기"
        size="large"
        description="1400px 폭 · 전체 셸 최대 880px · 본문 스크롤"
        footer={
          <CmsButton variant="secondary" onClick={close}>
            닫기
          </CmsButton>
        }
      >
        <div className="ds-modal-preview-document">
          {Array.from({ length: 24 }, (_, index) => (
            <div key={index} className="ds-modal-preview-document__row">
              미리보기 콘텐츠 행 {index + 1}
            </div>
          ))}
        </div>
      </ContentModal>
    </DsSection>
  )
}
