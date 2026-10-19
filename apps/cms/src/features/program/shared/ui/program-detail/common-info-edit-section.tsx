/**
 * 상세 공통정보 수정 — 등록 단락을 조회와 동일한 섹션 타이틀·간격으로 감싼다.
 * 타이틀 마크업은 조회 화면(`DetailInfoForm` 헤더 / `FormParagraphSectionHeader`)과 동일.
 */
import type { ReactNode } from 'react'
import type { Program } from '@/types/domain'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { formatDate } from '@/features/program/shared/lib/program-detail-info-constants'
import { ProgramPortalHomeFeaturedFields } from '@/features/program/shared/ui/program-detail/portal-home-featured-fields'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './common-info-edit-section.css'

export function ProgramCommonInfoEditSections({ children }: { children: ReactNode }) {
  return <div className="program-common-info-edit">{children}</div>
}

export function ProgramCommonInfoEditSection({
  title,
  description,
  required = false,
  titleTrailing,
  bodyClassName,
  highlightParagraphId,
  children,
}: {
  title: string
  /** 타이틀 하단 설명 — 등록 양식 카드와 동일 문구 */
  description?: string
  required?: boolean
  titleTrailing?: ReactNode
  /** 등록 단락이 2개 이상일 때 `program-common-info-edit__section-body--stacked` */
  bodyClassName?: string
  /** 등록 시드 단락 id — 필수 누락 시 제목 강조 */
  highlightParagraphId?: string
  children: ReactNode
}) {
  return (
    <section className="program-common-info-edit__section" aria-label={title}>
      <FormParagraphSectionHeader
        title={title}
        description={description}
        titleTrailing={titleTrailing}
        surface="responseEntry"
        titleAligned
        required={required}
        highlightParagraphId={highlightParagraphId}
      />
      <div
        className={['program-common-info-edit__section-body', bodyClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </section>
  )
}

/** 기본 정보 상단 — 최초 등록일 / 마지막 수정일 (수정 모드에서도 조회 표시) */
export function ProgramCommonInfoEditRegistrationAuditForm({ program }: { program: Program }) {
  return (
    <DetailInfoForm
      title="기본 정보 — 등록 이력"
      hideHeader
      mode="view"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="최초 등록일"
          view={
            <>
              {formatDate(program.createdAt)}
              {program.createdByName ? (
                <>
                  <DetailInfoForm.InputsSeparator />
                  {program.createdByName}
                </>
              ) : null}
            </>
          }
        />
        <DetailInfoForm.Field
          label="마지막 수정일"
          view={
            <>
              {formatDate(program.updatedAt)}
              {program.updatedByName ? (
                <>
                  <DetailInfoForm.InputsSeparator />
                  {program.updatedByName}
                </>
              ) : null}
            </>
          }
        />
      </DetailInfoForm.Row>
      <ProgramPortalHomeFeaturedFields
        isEdit={false}
        featuredOnHome={program.featuredOnHome === true}
        homeDisplayOrder={program.homeDisplayOrder}
      />
    </DetailInfoForm>
  )
}
