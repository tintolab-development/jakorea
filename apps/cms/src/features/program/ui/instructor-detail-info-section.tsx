/**
 * 강사 정보 탭 전용 상세 정보 섹션 (읽기 전용)
 * - 썸네일 이미지, 프로그램 설명, 모집 안내, 지원 방법, 추가 내용, 기타사항, 첨부 파일
 * - 상단 안내: "공란인 경우, 상세 페이지에서 항목 미노출 됩니다."
 * - program-detail-info-tab 스타일 및 DetailInfoSection 셀 구조 재사용
 */

import { Image } from 'antd'
import type { Program } from '@/types/domain'
import { FileSelectField } from '@/shared/ui/file-select-field'
import {
  DEFAULT_ADDITIONAL_HTML,
  DEFAULT_PROGRAM_DESCRIPTION,
  DEFAULT_RECRUITMENT_GUIDE,
  getThumbnailFilename,
} from './program-detail-info-constants'
import './program-detail-info-tab.css'

export interface InstructorDetailInfoSectionProps {
  program: Program
}

export function InstructorDetailInfoSection({ program }: InstructorDetailInfoSectionProps) {
  const thumbnailUrl = program.keyVisualImage || program.posterImage
  const thumbnailFilename = thumbnailUrl ? getThumbnailFilename(thumbnailUrl) : ''
  const displayFileNames = program.attachmentFileNames ?? []
  const applicationMethod = program.applicationMethod ?? '-'
  const otherNotes = program.otherNotes ?? program.oneLineIntroduction ?? '-'

  return (
    <>
      <div className="program-detail-info-tab__section-header-row">
        <h3 className="program-detail-info-tab__section-title">상세 정보</h3>
        <p className="program-detail-info-tab__detail-note">
          공란인 경우, 상세 페이지에서 항목 미노출 됩니다.
        </p>
      </div>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>썸네일 이미지</th>
              <td className="program-detail-info-tab__cell--thumbnail">
                <div className="program-detail-info-tab__thumbnail-wrap">
                  <div className="program-detail-info-tab__thumbnail-row">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={program.title}
                        className="program-detail-info-tab__thumbnail-img"
                        preview={{ mask: '확대 보기' }}
                      />
                    ) : (
                      <div className="program-detail-info-tab__thumbnail-placeholder-box">
                        이미지 없음
                      </div>
                    )}
                    <div className="program-detail-info-tab__thumbnail-meta">
                      <span className="program-detail-info-tab__thumbnail-filename">
                        {thumbnailFilename || '파일명.jpg'}
                      </span>
                      <FileSelectField
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        disabled
                        buttonLabel="파일 선택"
                        className="program-detail-info-tab__file-select"
                        fileNames={[]}
                        guideLines={[
                          '파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다. / 가로 사이즈 500px 권장, 세로 사이즈 무관',
                          '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th>프로그램 설명</th>
              <td>
                <div className="program-detail-info-tab__content-block">
                  {program.description || DEFAULT_PROGRAM_DESCRIPTION}
                </div>
              </td>
            </tr>
            <tr>
              <th>모집 안내</th>
              <td>
                <div className="program-detail-info-tab__content-block">
                  {program.recruitmentGuide || DEFAULT_RECRUITMENT_GUIDE}
                </div>
              </td>
            </tr>
            <tr>
              <th>지원 방법</th>
              <td>
                <div className="program-detail-info-tab__content-block">
                  {applicationMethod}
                </div>
              </td>
            </tr>
            <tr>
              <th>추가 내용</th>
              <td>
                <div className="program-detail-info-tab__additional-content">
                  <div className="program-detail-info-tab__additional-image-wrap">
                    <Image
                      src={
                        program.keyVisualImage ||
                        program.posterImage ||
                        'https://via.placeholder.com/600x200/f0f0f0/999?text=추가+내용+이미지'
                      }
                      alt="추가 내용"
                      className="program-detail-info-tab__additional-image"
                      preview={{ mask: '확대 보기' }}
                      fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200' viewBox='0 0 600 200'%3E%3Crect fill='%23f5f5f5' width='600' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E추가 내용 이미지%3C/text%3E%3C/svg%3E"
                    />
                  </div>
                  <div
                    className="program-detail-info-tab__editor-content toastui-editor-contents"
                    dangerouslySetInnerHTML={{
                      __html: program.additionalContentHtml || DEFAULT_ADDITIONAL_HTML,
                    }}
                  />
                </div>
              </td>
            </tr>
            <tr>
              <th>기타사항</th>
              <td>
                <div className="program-detail-info-tab__content-block">
                  {otherNotes}
                </div>
              </td>
            </tr>
            <tr>
              <th>첨부 파일</th>
              <td>
                <FileSelectField
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  multiple
                  disabled
                  buttonLabel="파일 선택"
                  fileNames={displayFileNames}
                  guideLines={[
                    '파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
                    '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                  ]}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
