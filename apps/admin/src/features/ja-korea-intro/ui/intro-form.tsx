import { useCallback, useState, type ReactNode } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  IntroContentBlock,
  IntroSection01,
  IntroSection02,
  JaKoreaIntro,
  VisionMission,
} from '@/entities/ja-korea-intro/model/types'
import { useSaveJaKoreaIntro } from '@/features/ja-korea-intro/api/hooks'
import { ContentNestedTable } from '@/features/ja-korea-intro/ui/content-nested-table'
import { CmsButton, CmsInput, CmsTextArea, useCmsAlert } from '@/shared/ui'

import './intro-form.css'

type Props = {
  data: JaKoreaIntro
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="ja-korea-intro-section-title">
      <span className="ja-korea-intro-section-title__marker" aria-hidden />
      <span className="ja-korea-intro-section-title__text">{children}</span>
    </div>
  )
}

function PrelineView({ value }: { value: string }) {
  return <span className="ja-korea-intro-preline">{value || '-'}</span>
}

function cloneIntro(data: JaKoreaIntro): JaKoreaIntro {
  return {
    section01: { ...data.section01 },
    section02: {
      titlePhrase: data.section02.titlePhrase,
      subTitle: data.section02.subTitle,
      content01: { ...data.section02.content01 },
      content02: { ...data.section02.content02 },
    },
    vision: { ...data.vision },
    mission: { ...data.mission },
    updatedAt: data.updatedAt,
    version: data.version,
  }
}

export function IntroFormCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveJaKoreaIntro()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<JaKoreaIntro>(() => cloneIntro(data))

  const handleEdit = useCallback(() => {
    setDraft(cloneIntro(data))
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(cloneIntro(data))
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync(draft)
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: 'JA Korea 소개 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, saveMutation, showAlert])

  const updateSection01 = useCallback((patch: Partial<IntroSection01>) => {
    setDraft(prev => ({
      ...prev,
      section01: { ...prev.section01, ...patch },
    }))
  }, [])

  const updateSection02 = useCallback((patch: Partial<IntroSection02>) => {
    setDraft(prev => ({
      ...prev,
      section02: { ...prev.section02, ...patch },
    }))
  }, [])

  const updateContent01 = useCallback((patch: Partial<IntroContentBlock>) => {
    setDraft(prev => ({
      ...prev,
      section02: {
        ...prev.section02,
        content01: { ...prev.section02.content01, ...patch },
      },
    }))
  }, [])

  const updateContent02 = useCallback((patch: Partial<IntroContentBlock>) => {
    setDraft(prev => ({
      ...prev,
      section02: {
        ...prev.section02,
        content02: { ...prev.section02.content02, ...patch },
      },
    }))
  }, [])

  const updateVision = useCallback((patch: Partial<VisionMission>) => {
    setDraft(prev => ({
      ...prev,
      vision: { ...prev.vision, ...patch },
    }))
  }, [])

  const updateMission = useCallback((patch: Partial<VisionMission>) => {
    setDraft(prev => ({
      ...prev,
      mission: { ...prev.mission, ...patch },
    }))
  }, [])

  const mode = isEditing ? 'edit' : 'view'
  const section01 = isEditing ? draft.section01 : data.section01
  const section02 = isEditing ? draft.section02 : data.section02
  const vision = isEditing ? draft.vision : data.vision
  const mission = isEditing ? draft.mission : data.mission

  const content01Table = (
    <ContentNestedTable
      data={section02.content01}
      mode={mode}
      ariaLabel="콘텐츠 01"
      onChange={updateContent01}
    />
  )
  const content02Table = (
    <ContentNestedTable
      data={section02.content02}
      mode={mode}
      ariaLabel="콘텐츠 02"
      onChange={updateContent02}
    />
  )

  return (
    <div className="admin-list-card ja-korea-intro-card">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">JA Korea 소개 관리</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                loading={saveMutation.isPending}
                onClick={() => {
                  void handleSave()
                }}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="large" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <div className="ja-korea-intro-card__body">
        <section className="ja-korea-intro-section">
          <SectionTitle>소개글 섹션 01</SectionTitle>
          <DetailInfoForm title="소개글 섹션 01" hideHeader mode={mode}>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="메인 타이틀"
                view={<PrelineView value={section01.mainTitle} />}
                edit={
                  <CmsInput
                    inputSize="medium"
                    width="100%"
                    value={draft.section01.mainTitle}
                    onChange={e => updateSection01({ mainTitle: e.target.value })}
                    placeholder="메인 타이틀을 입력하세요"
                  />
                }
              />
              <DetailInfoForm.Field
                label="서브 타이틀"
                view={<PrelineView value={section01.subTitle} />}
                edit={
                  <CmsInput
                    inputSize="medium"
                    width="100%"
                    value={draft.section01.subTitle}
                    onChange={e => updateSection01({ subTitle: e.target.value })}
                    placeholder="서브 타이틀을 입력하세요"
                  />
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </section>

        <section className="ja-korea-intro-section">
          <SectionTitle>소개글 섹션 02</SectionTitle>
          <DetailInfoForm title="소개글 섹션 02" hideHeader mode={mode}>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="타이틀 문구"
                view={<PrelineView value={section02.titlePhrase} />}
                edit={
                  <CmsInput
                    inputSize="medium"
                    width="100%"
                    value={draft.section02.titlePhrase}
                    onChange={e => updateSection02({ titlePhrase: e.target.value })}
                    placeholder="타이틀 문구를 입력하세요"
                  />
                }
              />
              <DetailInfoForm.Field
                label="서브 타이틀"
                view={<PrelineView value={section02.subTitle} />}
                edit={
                  <CmsInput
                    inputSize="medium"
                    width="100%"
                    value={draft.section02.subTitle}
                    onChange={e => updateSection02({ subTitle: e.target.value })}
                    placeholder="서브 타이틀을 입력하세요"
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="콘텐츠 01" view={content01Table} edit={content01Table} />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="콘텐츠 02" view={content02Table} edit={content02Table} />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </section>

        <section className="ja-korea-intro-section">
          <SectionTitle>Global Vision</SectionTitle>
          <DetailInfoForm title="Global Vision" hideHeader mode={mode}>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="상단 서브 텍스트"
                view={<PrelineView value={vision.topSubText} />}
                edit={
                  <CmsTextArea
                    className="cms-textarea--fixed-rows"
                    inputSize="medium"
                    width="100%"
                    rows={2}
                    value={draft.vision.topSubText}
                    onChange={e => updateVision({ topSubText: e.target.value })}
                    placeholder="상단 서브 텍스트를 입력하세요"
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="메인 텍스트"
                view={<PrelineView value={vision.mainText} />}
                edit={
                  <CmsTextArea
                    className="cms-textarea--fixed-rows"
                    inputSize="medium"
                    width="100%"
                    rows={2}
                    value={draft.vision.mainText}
                    onChange={e => updateVision({ mainText: e.target.value })}
                    placeholder="메인 텍스트를 입력하세요"
                  />
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </section>

        <section className="ja-korea-intro-section">
          <SectionTitle>Global Mission</SectionTitle>
          <DetailInfoForm title="Global Mission" hideHeader mode={mode}>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="상단 서브 텍스트"
                view={<PrelineView value={mission.topSubText} />}
                edit={
                  <CmsTextArea
                    className="cms-textarea--fixed-rows"
                    inputSize="medium"
                    width="100%"
                    rows={2}
                    value={draft.mission.topSubText}
                    onChange={e => updateMission({ topSubText: e.target.value })}
                    placeholder="상단 서브 텍스트를 입력하세요"
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="메인 텍스트"
                view={<PrelineView value={mission.mainText} />}
                edit={
                  <CmsTextArea
                    className="cms-textarea--fixed-rows"
                    inputSize="medium"
                    width="100%"
                    rows={2}
                    value={draft.mission.mainText}
                    onChange={e => updateMission({ mainText: e.target.value })}
                    placeholder="메인 텍스트를 입력하세요"
                  />
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </section>
      </div>
    </div>
  )
}
