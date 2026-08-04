import { useCallback, useMemo, useState } from 'react'
import { Input, InputNumber, Select, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  DonationContent,
  EducationProgramContent,
  ImpactStoryContent,
  LinkedProgram,
  PerformanceContent,
} from '@/features/main/content/model/types'
import { useMainContentStore } from '@/features/main/content/lib/store'
import {
  getImpactStoryOptions,
  getLatestPrograms,
} from '@/features/main/content/lib/mock-linked'
import { ContentSectionCard } from '@/features/main/content/ui/section-card'
import styles from './page.module.css'

const { Text, Paragraph } = Typography
const { TextArea } = Input

type SectionKey = 'education' | 'impact' | 'performance' | 'donation'

/**
 * 메인 > 콘텐츠 관리
 * Notion: 3. 콘텐츠 관리 — 영역별 독립 수정
 */
export function ContentsPage() {
  const content = useMainContentStore(s => s.content)
  const saveEducation = useMainContentStore(s => s.saveEducation)
  const saveImpact = useMainContentStore(s => s.saveImpact)
  const savePerformance = useMainContentStore(s => s.savePerformance)
  const saveDonation = useMainContentStore(s => s.saveDonation)

  const [editing, setEditing] = useState<Record<SectionKey, boolean>>({
    education: false,
    impact: false,
    performance: false,
    donation: false,
  })

  const [educationDraft, setEducationDraft] = useState<EducationProgramContent>(content.education)
  const [impactDraft, setImpactDraft] = useState<ImpactStoryContent>(content.impact)
  const [performanceDraft, setPerformanceDraft] = useState<PerformanceContent>(content.performance)
  const [donationDraft, setDonationDraft] = useState<DonationContent>(content.donation)

  const programs = useMemo(() => getLatestPrograms(8), [])
  const impactOptions = useMemo(() => getImpactStoryOptions(), [])

  const startEdit = useCallback(
    (key: SectionKey) => {
      if (key === 'education') setEducationDraft({ ...content.education })
      if (key === 'impact') setImpactDraft({ ...content.impact })
      if (key === 'performance') setPerformanceDraft({ ...content.performance })
      if (key === 'donation') setDonationDraft({ ...content.donation })
      setEditing(prev => ({ ...prev, [key]: true }))
    },
    [content]
  )

  const cancelEdit = useCallback(
    (key: SectionKey) => {
      if (key === 'education') setEducationDraft({ ...content.education })
      if (key === 'impact') setImpactDraft({ ...content.impact })
      if (key === 'performance') setPerformanceDraft({ ...content.performance })
      if (key === 'donation') setDonationDraft({ ...content.donation })
      setEditing(prev => ({ ...prev, [key]: false }))
    },
    [content]
  )

  const handleSaveEducation = useCallback(() => {
    if (!educationDraft.title.trim()) {
      message.error('타이틀 문구를 입력해 주세요.')
      return
    }
    saveEducation(educationDraft)
    setEditing(prev => ({ ...prev, education: false }))
    message.success('교육 프로그램 영역이 저장되었습니다.')
  }, [educationDraft, saveEducation])

  const handleSaveImpact = useCallback(() => {
    if (!impactDraft.title.trim()) {
      message.error('타이틀 문구를 입력해 주세요.')
      return
    }
    saveImpact(impactDraft)
    setEditing(prev => ({ ...prev, impact: false }))
    message.success('임팩트 스토리 영역이 저장되었습니다.')
  }, [impactDraft, saveImpact])

  const handleSavePerformance = useCallback(() => {
    if (!performanceDraft.title.trim()) {
      message.error('타이틀 문구를 입력해 주세요.')
      return
    }
    savePerformance(performanceDraft)
    setEditing(prev => ({ ...prev, performance: false }))
    message.success('실적 및 성과 영역이 저장되었습니다.')
  }, [performanceDraft, savePerformance])

  const handleSaveDonation = useCallback(() => {
    if (!donationDraft.title.trim()) {
      message.error('타이틀 문구를 입력해 주세요.')
      return
    }
    saveDonation(donationDraft)
    setEditing(prev => ({ ...prev, donation: false }))
    message.success('정기후원 영역이 저장되었습니다.')
  }, [donationDraft, saveDonation])

  const programColumns = useMemo<ColumnsType<LinkedProgram>>(
    () => [
      {
        title: 'No.',
        width: 64,
        align: 'center',
        render: (_v, _r, index) => index + 1,
      },
      { title: '프로그램명', dataIndex: 'title' },
      {
        title: '공개일',
        dataIndex: 'publishedAt',
        width: 120,
      },
    ],
    []
  )

  const educationView = editing.education ? educationDraft : content.education
  const impactView = editing.impact ? impactDraft : content.impact
  const performanceView = editing.performance ? performanceDraft : content.performance
  const donationView = editing.donation ? donationDraft : content.donation

  const featuredTitle =
    impactOptions.find(item => item.id === impactView.featuredStoryId)?.title ?? '—'

  return (
    <div className={styles.page}>
      <ContentSectionCard
        title="교육 프로그램 관리"
        editing={editing.education}
        onEdit={() => startEdit('education')}
        onCancel={() => cancelEdit('education')}
        onSave={handleSaveEducation}
      >
        <label className={styles.field}>
          <span className={styles.label}>타이틀 문구</span>
          {editing.education ? (
            <Input
              value={educationDraft.title}
              onChange={e => setEducationDraft(prev => ({ ...prev, title: e.target.value }))}
              placeholder="타이틀 문구를 입력하세요"
              maxLength={120}
            />
          ) : (
            <Text>{educationView.title || '—'}</Text>
          )}
        </label>
        <div className={styles.field}>
          <span className={styles.label}>프로그램 목록</span>
          <Text type="secondary" className={styles.hint}>
            프로그램 관리에서 홈페이지 공개된 프로그램을 최신순 8개까지 연동합니다. 이 화면에서
            직접 등록·수정하지 않습니다.
          </Text>
          <Table
            className="admin-data-table"
            size="small"
            rowKey="id"
            pagination={false}
            columns={programColumns}
            dataSource={programs}
          />
        </div>
      </ContentSectionCard>

      <ContentSectionCard
        title="임팩트 스토리 관리"
        editing={editing.impact}
        onEdit={() => startEdit('impact')}
        onCancel={() => cancelEdit('impact')}
        onSave={handleSaveImpact}
      >
        <label className={styles.field}>
          <span className={styles.label}>타이틀 문구</span>
          {editing.impact ? (
            <TextArea
              value={impactDraft.title}
              onChange={e => setImpactDraft(prev => ({ ...prev, title: e.target.value }))}
              placeholder="타이틀 문구를 입력하세요"
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={200}
            />
          ) : (
            <Paragraph className={styles.preline}>{impactView.title || '—'}</Paragraph>
          )}
        </label>
        <label className={styles.field}>
          <span className={styles.label}>메인 영상 유튜브 링크</span>
          {editing.impact ? (
            <Input
              value={impactDraft.youtubeUrl}
              onChange={e => setImpactDraft(prev => ({ ...prev, youtubeUrl: e.target.value }))}
              placeholder="YouTube URL을 입력하세요"
            />
          ) : impactView.youtubeUrl ? (
            <a href={impactView.youtubeUrl} target="_blank" rel="noreferrer">
              {impactView.youtubeUrl}
            </a>
          ) : (
            <Text type="secondary">—</Text>
          )}
        </label>
        <label className={styles.field}>
          <span className={styles.label}>대표 콘텐츠 설정</span>
          {editing.impact ? (
            <Select
              value={impactDraft.featuredStoryId}
              onChange={value =>
                setImpactDraft(prev => ({ ...prev, featuredStoryId: value }))
              }
              options={impactOptions.map(item => ({
                value: item.id,
                label: item.title,
              }))}
              placeholder="대표 콘텐츠를 선택하세요"
              allowClear
              style={{ width: '100%' }}
            />
          ) : (
            <Text>{featuredTitle}</Text>
          )}
        </label>
      </ContentSectionCard>

      <ContentSectionCard
        title="실적 및 성과 관리"
        editing={editing.performance}
        onEdit={() => startEdit('performance')}
        onCancel={() => cancelEdit('performance')}
        onSave={handleSavePerformance}
      >
        <label className={styles.field}>
          <span className={styles.label}>타이틀 문구</span>
          {editing.performance ? (
            <Input
              value={performanceDraft.title}
              onChange={e => setPerformanceDraft(prev => ({ ...prev, title: e.target.value }))}
              placeholder="타이틀 문구를 입력하세요"
              maxLength={120}
            />
          ) : (
            <Text>{performanceView.title || '—'}</Text>
          )}
        </label>
        <div className={styles.statsGrid}>
          {(
            [
              ['networkCount', '전국 교육 네트워크 분포 수'],
              ['partnerCount', '전문 협업 학교, 기관, 단체 수'],
              ['volunteerCount', '전문 봉사자, 교사, 강사 수'],
              ['beneficiaryCount', '교육 수혜자 청소년들의 수'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className={styles.field}>
              <span className={styles.label}>{label}</span>
              {editing.performance ? (
                <InputNumber
                  min={0}
                  value={performanceDraft[key]}
                  onChange={value =>
                    setPerformanceDraft(prev => ({
                      ...prev,
                      [key]: typeof value === 'number' ? value : 0,
                    }))
                  }
                  style={{ width: '100%' }}
                />
              ) : (
                <Text>{performanceView[key].toLocaleString()}</Text>
              )}
            </label>
          ))}
        </div>
        <label className={styles.field}>
          <span className={styles.label}>하단 문구</span>
          {editing.performance ? (
            <TextArea
              value={performanceDraft.bottomText}
              onChange={e =>
                setPerformanceDraft(prev => ({ ...prev, bottomText: e.target.value }))
              }
              placeholder="하단 문구를 입력하세요"
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={300}
            />
          ) : (
            <Paragraph className={styles.preline}>{performanceView.bottomText || '—'}</Paragraph>
          )}
        </label>
      </ContentSectionCard>

      <ContentSectionCard
        title="정기후원 관리"
        editing={editing.donation}
        onEdit={() => startEdit('donation')}
        onCancel={() => cancelEdit('donation')}
        onSave={handleSaveDonation}
      >
        <Text type="secondary" className={styles.hint}>
          후원 기업 목록은 [후원하기 관리] &gt; [후원사]에서 등록·관리된 항목을 연동합니다. 이
          화면에서 직접 등록·수정하지 않습니다.
        </Text>
        <label className={styles.field}>
          <span className={styles.label}>타이틀 문구</span>
          {editing.donation ? (
            <TextArea
              value={donationDraft.title}
              onChange={e => setDonationDraft(prev => ({ ...prev, title: e.target.value }))}
              placeholder="타이틀 문구를 입력하세요"
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={200}
            />
          ) : (
            <Paragraph className={styles.preline}>{donationView.title || '—'}</Paragraph>
          )}
        </label>
        <div className={styles.ctaGrid}>
          <label className={styles.field}>
            <span className={styles.label}>버튼명 01</span>
            {editing.donation ? (
              <Input
                value={donationDraft.cta1Label}
                onChange={e =>
                  setDonationDraft(prev => ({ ...prev, cta1Label: e.target.value }))
                }
                placeholder="버튼명 01"
                maxLength={40}
              />
            ) : (
              <Text>{donationView.cta1Label || '—'}</Text>
            )}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>연결 링크 01</span>
            {editing.donation ? (
              <Input
                value={donationDraft.cta1Url}
                onChange={e => setDonationDraft(prev => ({ ...prev, cta1Url: e.target.value }))}
                placeholder="연결 링크 01"
              />
            ) : donationView.cta1Url ? (
              <Text>{donationView.cta1Url}</Text>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>버튼명 02</span>
            {editing.donation ? (
              <Input
                value={donationDraft.cta2Label}
                onChange={e =>
                  setDonationDraft(prev => ({ ...prev, cta2Label: e.target.value }))
                }
                placeholder="버튼명 02"
                maxLength={40}
              />
            ) : (
              <Text>{donationView.cta2Label || '—'}</Text>
            )}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>연결 링크 02</span>
            {editing.donation ? (
              <Input
                value={donationDraft.cta2Url}
                onChange={e => setDonationDraft(prev => ({ ...prev, cta2Url: e.target.value }))}
                placeholder="연결 링크 02"
              />
            ) : donationView.cta2Url ? (
              <Text>{donationView.cta2Url}</Text>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </label>
        </div>
      </ContentSectionCard>
    </div>
  )
}
