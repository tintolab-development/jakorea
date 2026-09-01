/**
 * Design System — Posts & attachments (Current)
 * 게시글 상세 화면 축: 첨부 · 댓글 · 이모지 피커 · 반응 목록 · 읽음 현황 · (feature) 상세 모달
 */

import { useMemo, useState } from 'react'
import {
  getReactionsByPostId,
  getReactionUsersByPostId,
  mockProgramFiles,
  mockProgramPostsMap,
} from '@/data/mock'
import { PostDetailModal } from '@/features/user/detail/ui/modal/post-detail-modal'
import { PostReadStatusPopoverContent } from '@/features/user/detail/ui/post-read-status-popover'
import {
  FileSelectField,
  AttachmentDownloadList,
  AttachmentDownloadIcon,
  ReactionEmojiPicker,
  ReactionUserList,
  CommentList,
  CommentComposer,
  REACTION_EMOJI_ITEMS,
  CmsButton,
} from '@/shared/ui'
import type { UUID } from '@/types'
import { DsDemo, DsSection } from './section'

/** 첨부·댓글·반응이 있는 mock 게시글 */
const DS_POST_DETAIL_DEMO_ID = 'post-hsbc-gs-002' as UUID

export function PostsAttachmentsSection() {
  const [fileNames, setFileNames] = useState<string[]>(['sample-guide.pdf'])
  const [comment, setComment] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null)
  const [postDetailOpen, setPostDetailOpen] = useState(false)

  const demoPost = mockProgramPostsMap.get(DS_POST_DETAIL_DEMO_ID) ?? null
  const demoFiles = useMemo(
    () => mockProgramFiles.filter(file => file.postId === DS_POST_DETAIL_DEMO_ID),
    []
  )
  const demoReactions = useMemo(
    () => getReactionsByPostId(DS_POST_DETAIL_DEMO_ID).sort((a, b) => b.count - a.count),
    []
  )
  const demoReactionUsers = useMemo(
    () => getReactionUsersByPostId(DS_POST_DETAIL_DEMO_ID),
    []
  )

  return (
    <DsSection
      id="posts-attachments"
      title="Posts & attachments"
      description={
        '게시글 상세 화면 Presentational Current. ' +
        'AttachmentDownloadList · CommentList · CommentComposer · ReactionEmojiPicker · ReactionUserList. ' +
        '읽음/안읽음 팝업은 feature(PostReadStatusPopoverContent). PostDetailModal은 ContentModal 셸 조합.'
      }
    >
      <DsDemo label="PostDetailModal (게시글 상세 셸)">
        <p className="ds-demo__hint">
          <code>features/.../post-detail-modal</code> · ContentModal 800px · mock{' '}
          <code>{DS_POST_DETAIL_DEMO_ID}</code>. 눈·이모지 아이콘으로 아래 팝업을 모달 안에서 확인할 수
          있습니다.
        </p>
        <CmsButton
          variant="primary"
          size="medium"
          className="cms-button--toolbar-auto"
          style={{ width: 'auto', minWidth: 140, maxWidth: 'none' }}
          onClick={() => setPostDetailOpen(true)}
          disabled={!demoPost}
        >
          게시글 상세 열기
        </CmsButton>
        <PostDetailModal
          open={postDetailOpen}
          onCancel={() => setPostDetailOpen(false)}
          post={demoPost}
          files={demoFiles}
          commentAuthorName="디자인시스템"
          commentAuthorRoleLabel="관리자"
        />
      </DsDemo>

      <DsDemo label="PostReadStatusPopoverContent (읽음 / 안읽음)">
        <p className="ds-demo__hint">
          조회수(눈) 클릭 Popover 본문. 읽음 탭은 「읽음」 배지, 안읽음 탭은 체크 + 전체 선택 / 알림
          발송.
        </p>
        <div className="ds-demo__row" style={{ alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          {demoPost ? (
            <PostReadStatusPopoverContent
              postId={demoPost.id}
              programId={demoPost.programId}
              postSchoolId={demoPost.schoolId}
            />
          ) : (
            <p className="ds-demo__hint">demo post 없음</p>
          )}
        </div>
      </DsDemo>

      <DsDemo label="ReactionUserList (반응 목록)">
        <p className="ds-demo__hint">
          <code>shared/ui/posts/reaction-user-list</code> · 이모지 집계 헤더 + 사용자 행. 반응 아이콘
          Popover 본문 Current.
        </p>
        <ReactionUserList
          reactions={demoReactions}
          users={demoReactionUsers}
          currentUserName="김○○"
          currentUserRoleLabel="학생"
        />
      </DsDemo>

      <DsDemo label="AttachmentDownloadList / AttachmentDownloadIcon">
        <div className="ds-demo__stack">
          <AttachmentDownloadIcon size={22} style={{ color: '#3d3d3d' }} />
          <AttachmentDownloadList
            items={[
              { id: '1', fileName: '(2026) JA Korea 경제금융교육 커리큘럼.pdf' },
              { id: '2', fileName: '2회차 강의 자료_모의 면접 체크리스트.xlsx' },
            ]}
            onDownload={item => {
              void item
            }}
          />
        </div>
      </DsDemo>

      <DsDemo label="CommentList + CommentComposer">
        <div
          className="ds-demo__posts-comments"
          style={{
            border: '1px solid #d4d4d4',
            borderRadius: 10,
            background: '#fff',
            maxWidth: 640,
          }}
        >
          <CommentList
            items={[
              {
                id: 'c1',
                authorName: '김○○',
                createdAtLabel: '2026년 1월 15일 오후 4:00',
                content: '확인했습니다!',
              },
              {
                id: 'c2',
                authorName: '최○○',
                createdAtLabel: '2026년 1월 15일 오후 5:00',
                content: '넵~~',
              },
            ]}
          />
          <CommentComposer
            value={comment}
            onChange={setComment}
            onSubmit={() => {
              setComment('')
              setSelectedEmoji(null)
              setEmojiOpen(false)
            }}
            emojiPickerOpen={emojiOpen}
            onEmojiToggle={() => setEmojiOpen(prev => !prev)}
            selectedEmojiIndex={selectedEmoji}
            onEmojiSelect={index => {
              setSelectedEmoji(prev => (prev === index ? null : index))
              setEmojiOpen(false)
            }}
          />
        </div>
      </DsDemo>

      <DsDemo label="ReactionEmojiPicker (작성용 피커)">
        <div className="ds-demo__stack">
          <ReactionEmojiPicker
            onSelect={index => setSelectedEmoji(prev => (prev === index ? null : index))}
          />
          {selectedEmoji != null ? (
            <p className="ds-demo__hint">
              선택: {REACTION_EMOJI_ITEMS[selectedEmoji].label}{' '}
              <span aria-hidden>{REACTION_EMOJI_ITEMS[selectedEmoji].emoji}</span>
            </p>
          ) : (
            <p className="ds-demo__hint">댓글 작성 시 붙이는 이모지 피커입니다.</p>
          )}
        </div>
      </DsDemo>

      <DsDemo label="FileSelectField (게시글 등록 패턴)">
        <p className="ds-demo__hint">
          폼 섹션에도 있습니다. 버튼 medium · 가이드 가로 배치. SSOT{' '}
          <code>file-select-detail-form</code>. 게시글 가이드 문구 예시는 아래와 같습니다.
        </p>
        <FileSelectField
          accept=".jpg,.jpeg,.png"
          fileNames={fileNames}
          guideLines={[
            '- 파일은 총 최대 15MB까지 JPG, PNG 형식만 등록 가능합니다.',
            '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
          ]}
          onFilesChange={files => setFileNames(prev => [...prev, ...files.map(f => f.name)])}
          onRemoveFile={index => setFileNames(prev => prev.filter((_, i) => i !== index))}
        />
      </DsDemo>
    </DsSection>
  )
}
