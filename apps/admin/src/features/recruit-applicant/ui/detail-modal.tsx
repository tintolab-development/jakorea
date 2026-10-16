/**
 * 인재채용 신청 상세 모달 (조회 전용)
 * 가로 2열은 Row type="double", 한 줄 전체는 type="single".
 */

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  RecruitApplicantDetail,
  RecruitCareerType,
  RecruitEducationLevel,
  RecruitJobInterest,
} from '@/entities/recruit-applicant/model/types'
import { shouldUseRecruitApplicantRemoteApi } from '@/features/recruit-applicant/api/capabilities'
import { downloadRecruitApplicantAttachmentService } from '@/features/recruit-applicant/api/service'
import { formatDateTimeDotWithKoreanWeekday } from '@/shared/lib/format-display'
import { CmsButton, ConfirmModal, ContentModal, useCmsAlert } from '@/shared/ui'

import './detail-modal.css'

dayjs.locale('ko')

type Props = {
  open: boolean
  data: RecruitApplicantDetail | null
  loading?: boolean
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onConfirm: () => void
  onDelete: () => void
}

const JOB_LABEL: Record<RecruitJobInterest, string> = {
  managementPlanning: '경영/기획',
  prDesign: '홍보/디자인',
  accounting: '회계',
  hrAdmin: '인사/총무',
  educationOps: '교육운영',
  other: '기타',
}

const CAREER_LABEL: Record<RecruitCareerType, string> = {
  newbie: '신입',
  experienced: '경력',
}

const EDUCATION_LABEL: Record<RecruitEducationLevel, string> = {
  highSchool: '고등학교 졸업',
  college: '전문대학 졸업',
  university: '대학교 졸업',
  master: '석사 졸업',
  doctor: '박사 졸업',
  other: '기타',
}

function joinParts(parts: Array<string | null | undefined>, separator: string): string {
  return parts
    .map(part => part?.trim() ?? '')
    .filter(part => part.length > 0)
    .join(separator)
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M5.5 2.5h6.2L14.5 5.3V16.5a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 2.5V5.8H14.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function RecruitApplicantDetailModal({
  open,
  data,
  loading = false,
  confirmLoading = false,
  deleteLoading = false,
  onCancel,
  onConfirm,
  onDelete,
}: Props) {
  const { showAlert } = useCmsAlert()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (!open) setDeleteConfirmOpen(false)
  }, [open])

  const isConfirmed = data?.status === 'confirmed'
  const waiting = loading && !data
  const busy = confirmLoading || deleteLoading || waiting

  const confirmedView = (() => {
    if (!data?.confirmedAt) return <span>-</span>
    const when = formatDateTimeDotWithKoreanWeekday(data.confirmedAt)
    const name = data.confirmedByName?.trim()
    if (!name) return <span>{when}</span>
    return (
      <span className="recruit-applicant-detail-modal__split">
        <span>{when}</span>
        <DetailInfoForm.TdDivider />
        <span>{name}</span>
      </span>
    )
  })()

  const educationView = (() => {
    if (!data) return <span>-</span>
    const level = data.educationLevel ? EDUCATION_LABEL[data.educationLevel] : ''
    const school = joinParts([data.schoolName, data.major], ' ')
    if (!level && !school) return <span>-</span>
    if (!school) return <span>{level}</span>
    if (!level) return <span>{school}</span>
    return (
      <span className="recruit-applicant-detail-modal__split">
        <span>{level}</span>
        <DetailInfoForm.TdDivider />
        <span>{school}</span>
      </span>
    )
  })()

  const attachmentView =
    data?.attachmentFileName && shouldUseRecruitApplicantRemoteApi() ? (
      <button
        type="button"
        className="recruit-applicant-detail-modal__attachment"
        onClick={() => {
          if (!data?.id) return
          void downloadRecruitApplicantAttachmentService(data.id)
            .then(result => {
              if (!result?.downloadUrl) {
                showAlert({
                  title: '다운로드 실패',
                  content: '첨부파일을 불러오지 못했습니다.',
                })
                return
              }
              window.open(result.downloadUrl, '_blank', 'noopener,noreferrer')
            })
            .catch(() => {
              showAlert({
                title: '다운로드 실패',
                content: '첨부파일 다운로드에 실패했습니다.',
              })
            })
        }}
      >
        <FileIcon className="recruit-applicant-detail-modal__file-icon" />
        <span>{data.attachmentFileName}</span>
      </button>
    ) : (
      <span>{data?.attachmentFileName || '-'}</span>
    )

  const footer = (
    <div className="recruit-applicant-detail-modal__footer">
      <CmsButton
        variant="delete"
        size="large"
        type="button"
        loading={deleteLoading}
        disabled={busy}
        onClick={() => setDeleteConfirmOpen(true)}
      >
        신청 삭제
      </CmsButton>
      <div className="recruit-applicant-detail-modal__footer-end">
        <CmsButton
          variant="secondary"
          size="large"
          type="button"
          disabled={busy}
          onClick={onCancel}
        >
          닫기
        </CmsButton>
        <CmsButton
          variant="primary"
          size="large"
          type="button"
          loading={confirmLoading}
          disabled={busy || isConfirmed || !data}
          onClick={onConfirm}
        >
          신청 확인
        </CmsButton>
      </div>
    </div>
  )

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="인재채용 신청 상세"
        size="large"
        className="recruit-applicant-detail-modal"
        footer={footer}
      >
        {waiting ? (
          <p className="recruit-applicant-detail-modal__loading">신청 정보를 불러오는 중입니다.</p>
        ) : data ? (
          <div className="recruit-applicant-detail-modal__scroll">
            <section
              className="recruit-applicant-detail-modal__section"
              aria-labelledby="recruit-applicant-basic-heading"
            >
              <h3
                id="recruit-applicant-basic-heading"
                className="recruit-applicant-detail-modal__section-title"
              >
                기본 정보
              </h3>
              <div className="recruit-applicant-detail-modal__table-stack">
                <DetailInfoForm
                  title="신청 처리 정보"
                  hideHeader
                  mode="view"
                  className="recruit-applicant-detail-modal__table"
                >
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="신청일시"
                      view={<span>{formatDateTimeDotWithKoreanWeekday(data.appliedAt)}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                    <DetailInfoForm.Field
                      label="확인일시"
                      view={confirmedView}
                      edit={null}
                      readOnlyDisplay
                    />
                  </DetailInfoForm.Row>
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="처리 상태"
                      view={
                        <span
                          className={
                            data.status === 'pending'
                              ? 'recruit-applicant-detail-modal__status recruit-applicant-detail-modal__status--pending'
                              : 'recruit-applicant-detail-modal__status recruit-applicant-detail-modal__status--confirmed'
                          }
                        >
                          {data.status === 'confirmed' ? '확인 완료' : '확인 대기'}
                        </span>
                      }
                      edit={null}
                      readOnlyDisplay
                    />
                    <DetailInfoForm.Field
                      label="개인정보 수집·이용 동의"
                      view={<span>{data.privacyAgreed ? '동의' : '-'}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                  </DetailInfoForm.Row>
                </DetailInfoForm>
                <DetailInfoForm
                  title="지원자 정보"
                  hideHeader
                  mode="view"
                  className="recruit-applicant-detail-modal__table"
                >
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="지원자명"
                      view={<span>{data.applicantName || '-'}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                    <DetailInfoForm.Field
                      label="관심 직무"
                      view={<span>{JOB_LABEL[data.jobInterest] ?? '-'}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                  </DetailInfoForm.Row>
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="연락처"
                      view={<span>{data.phone || '-'}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                    <DetailInfoForm.Field
                      label="이메일"
                      view={<span>{data.email || '-'}</span>}
                      edit={null}
                      readOnlyDisplay
                    />
                  </DetailInfoForm.Row>
                  <DetailInfoForm.Row type="single">
                    <DetailInfoForm.Field
                      label="자택 주소"
                      view={
                        <span>
                          {joinParts([data.addressRoad, data.addressDetail], ', ') || '-'}
                        </span>
                      }
                      edit={null}
                      readOnlyDisplay
                    />
                  </DetailInfoForm.Row>
                </DetailInfoForm>
              </div>
            </section>

            <section
              className="recruit-applicant-detail-modal__section"
              aria-labelledby="recruit-applicant-education-heading"
            >
              <h3
                id="recruit-applicant-education-heading"
                className="recruit-applicant-detail-modal__section-title"
              >
                학력 정보
              </h3>
              <DetailInfoForm
                title="학력 정보"
                hideHeader
                mode="view"
                className="recruit-applicant-detail-modal__table recruit-applicant-detail-modal__table--text"
              >
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="최종학력"
                    view={educationView}
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="학력정보"
                    view={
                      <span className="recruit-applicant-detail-modal__content">
                        {data.educationInfo.trim() || '-'}
                      </span>
                    }
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </section>

            <section
              className="recruit-applicant-detail-modal__section"
              aria-labelledby="recruit-applicant-career-heading"
            >
              <h3
                id="recruit-applicant-career-heading"
                className="recruit-applicant-detail-modal__section-title"
              >
                경력 정보
              </h3>
              <DetailInfoForm
                title="경력 정보"
                hideHeader
                mode="view"
                className="recruit-applicant-detail-modal__table recruit-applicant-detail-modal__table--text"
              >
                <DetailInfoForm.Row type="double">
                  <DetailInfoForm.Field
                    label="경력"
                    view={<span>{CAREER_LABEL[data.careerType] ?? '-'}</span>}
                    edit={null}
                    readOnlyDisplay
                  />
                  <DetailInfoForm.Field
                    label="증빙 서류"
                    view={attachmentView}
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="경력/경험/자격정보"
                    view={
                      <span className="recruit-applicant-detail-modal__content">
                        {data.careerInfo.trim() || '-'}
                      </span>
                    }
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            </section>
          </div>
        ) : null}
      </ContentModal>

      <ConfirmModal
        open={deleteConfirmOpen}
        title="신청 삭제"
        content={'선택한 신청을 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.'}
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={deleteLoading}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          onDelete()
        }}
      />
    </>
  )
}
