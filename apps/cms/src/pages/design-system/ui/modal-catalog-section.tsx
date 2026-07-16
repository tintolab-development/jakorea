import { useState } from 'react'
import { PermissionModal } from '@/shared/components/permission-modal'
import { ActionResultModal } from '@/shared/ui/action-result-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsModal } from '@/shared/ui/cms-modal'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { ContentModal } from '@/shared/ui/content-modal'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { ProgramHistoryDeleteBlockedModal } from '@/shared/ui/program-history-delete-blocked-modal'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  ALL_MODAL_CATALOG_ENTRIES,
  MODAL_CATALOG_CONSOLIDATE,
  MODAL_CATALOG_HELPERS,
  MODAL_CATALOG_IN_USE,
  MODAL_CATALOG_USAGE_LABEL,
  type ModalCatalogEntry,
  type ModalCatalogUsage,
} from '../data/modal-catalog'
import { DsDemo, DsSection } from './section'

type PreviewKey =
  | 'content'
  | 'confirm'
  | 'delete-guide'
  | 'permission'
  | 'fullpage'
  | 'action-result'
  | 'cms-modal'
  | 'history-blocked'
  | null

function usageClass(usage: ModalCatalogUsage): string {
  if (usage === 'in-use' || usage === 'api-only') return 'ds-coverage-legend__item--current'
  if (usage === 'helper') return 'ds-coverage-legend__item--current'
  return 'ds-coverage-legend__item--deferred'
}

function CatalogTable({
  rows,
  onPreview,
}: {
  rows: ModalCatalogEntry[]
  onPreview: (id: string) => void
}) {
  return (
    <table className="ds-field-table ds-modal-catalog-table">
      <thead>
        <tr>
          <th>컴포넌트</th>
          <th>구분</th>
          <th>파일 수</th>
          <th>기반</th>
          <th>비고 · ContentModal 통일 방향</th>
          <th>미리보기</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.name}>
            <td>
              <code>{row.name}</code>
              <div className="ds-modal-catalog-table__path">{row.path}</div>
            </td>
            <td>
              <span
                className={`ds-coverage-legend__item ${usageClass(row.usage)}`}
                style={{ whiteSpace: 'nowrap' }}
              >
                {MODAL_CATALOG_USAGE_LABEL[row.usage]}
              </span>
            </td>
            <td>~{row.filesApprox}</td>
            <td>
              <code style={{ fontSize: 12 }}>{row.basedOn}</code>
            </td>
            <td>
              <div>{row.note}</div>
              <div className="ds-demo__hint" style={{ marginTop: 4 }}>
                {row.consolidateHint}
              </div>
            </td>
            <td>
              {row.previewId ? (
                <CmsButton
                  variant="secondary"
                  size="small"
                  className="cms-button--toolbar-auto"
                  style={{ width: 'auto', minWidth: 72, maxWidth: 'none' }}
                  onClick={() => onPreview(row.previewId!)}
                >
                  열기
                </CmsButton>
              ) : (
                <span className="ds-demo__hint">—</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ModalCatalogSection() {
  const { showAlert } = useCmsAlert()
  const [preview, setPreview] = useState<PreviewKey>(null)

  const openPreview = (id: string) => {
    if (id === 'alert') {
      showAlert({
        title: '안내',
        content: 'useCmsAlert / cmsAlertModal → AlertModal(ContentModal) 경유입니다.',
      })
      return
    }
    setPreview(id as PreviewKey)
  }

  const close = () => setPreview(null)

  return (
    <DsSection
      id="modal-catalog"
      title="Modal catalog"
      description="shared 모달을 사용 중 / 통일 후보로 구분한 리스트입니다. 삭제하지 않고 ContentModal 통일 정리용으로 카탈로그합니다."
    >
      <p className="ds-note">
        목표: 카드형 UI는 <code>ContentModal</code>로 수렴. 풀페이지·팝오버는 역할 유지. 아래 「통일
        후보」는 소수 사용·내부 셸이며 <strong>삭제하지 않습니다</strong>.
      </p>
      <div className="ds-coverage-legend" aria-label="모달 사용 구분" style={{ marginBottom: 16 }}>
        <span className="ds-coverage-legend__item ds-coverage-legend__item--current">사용 중</span>
        <span>제품 화면에서 참조</span>
        <span className="ds-coverage-legend__item ds-coverage-legend__item--deferred">
          통일 후보
        </span>
        <span>소수·내부 셸 · 이관 검토 (삭제 금지)</span>
      </div>

      <DsDemo label={`사용 중 (${MODAL_CATALOG_IN_USE.length})`}>
        <CatalogTable rows={MODAL_CATALOG_IN_USE} onPreview={openPreview} />
      </DsDemo>

      <DsDemo label={`통일 후보 · 내부 셸 · 소수 사용 (${MODAL_CATALOG_CONSOLIDATE.length})`}>
        <p className="ds-note" style={{ marginTop: 0 }}>
          ContentModal로 흡수·직접 import 제거를 검토할 항목. 컴포넌트 파일은 유지합니다.
        </p>
        <CatalogTable rows={MODAL_CATALOG_CONSOLIDATE} onPreview={openPreview} />
      </DsDemo>

      <DsDemo label={`헬퍼 (${MODAL_CATALOG_HELPERS.length})`}>
        <CatalogTable rows={MODAL_CATALOG_HELPERS} onPreview={openPreview} />
      </DsDemo>

      <p className="ds-demo__hint">
        총 {ALL_MODAL_CATALOG_ENTRIES.length}개 · 파일 수는 design-system 제외 대략치 · 상세 라이브
        데모는 <a href="#modals">ContentModal</a> · <a href="#modal-processes">Modal processes</a> ·{' '}
        <a href="#modals-extended">Modals (extended)</a>도 참고.
      </p>

      <ContentModal
        open={preview === 'content'}
        onCancel={close}
        title="ContentModal"
        description="표준 카드형 모달 셸입니다."
        footer={
          <>
            <CmsButton variant="secondary" size="medium" type="button" onClick={close}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="medium" type="button" onClick={close}>
              확인
            </CmsButton>
          </>
        }
      >
        <div />
      </ContentModal>

      <ConfirmModal
        open={preview === 'confirm'}
        onCancel={close}
        onConfirm={close}
        title="확인"
        content="ConfirmModal 미리보기입니다."
      />

      <DeleteGuideModal
        open={preview === 'delete-guide'}
        onCancel={close}
        onConfirm={close}
        title="삭제 안내"
        lines={['선택한 항목을 삭제합니다.', '삭제된 항목은 복구할 수 없습니다.']}
      />

      <PermissionModal
        open={preview === 'permission'}
        onCancel={close}
        onConfirm={() => close()}
        variant="approve"
        title="승인"
        message="PermissionModal 미리보기입니다."
        showNotifyTiming={false}
      />

      <DetailFullPageModal
        open={preview === 'fullpage'}
        onClose={close}
        title="DetailFullPageModal"
      >
        <p style={{ margin: 0, padding: 24 }}>풀페이지 상세 미리보기입니다.</p>
      </DetailFullPageModal>

      <ActionResultModal
        open={preview === 'action-result'}
        onClose={close}
        title="등록 완료"
        body="[데모] 작업이 완료되었습니다."
      />

      <CmsModal
        open={preview === 'cms-modal'}
        onClose={close}
        title="CmsModal"
        content="버튼 1~2개 프리셋 모달입니다."
        buttons={[
          { label: '취소', onClick: close, variant: 'secondary' },
          { label: '확인', onClick: close, variant: 'primary' },
        ]}
      />

      <ProgramHistoryDeleteBlockedModal
        open={preview === 'history-blocked'}
        onClose={close}
      />
    </DsSection>
  )
}
