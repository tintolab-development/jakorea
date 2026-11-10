/** @vitest-environment jsdom */
import { useState } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfirmModal } from '@/shared/ui/confirm-modal'

/**
 * 신청 상세 [정보 수정] → 안내 확인 → 편집 → 헤더 [취소] 흐름의 렌더 테스트.
 * 원인: 안내 확인 창을 open=false로만 닫으면 닫힘 애니메이션 동안 모달 레이어(ant-modal-wrap)가 남아
 * 헤더 [취소] 첫 클릭을 가로챘다(브라우저 elementFromPoint로 192~2251ms 확인). jsdom에는 애니메이션이
 * 없어 가로채기 자체는 재현되지 않으므로, 여기서는 수정 패턴의 결과(레이어·중복 [취소] 없음, 1회 클릭 취소)를 검증한다.
 * 수정: 열려 있을 때만 마운트한다(applicants-detail·학교·참여자·교육받은교사 기관·회원 상세 공통).
 */
function EditFlowHarness({ onCancel, onSaveApi }: { onCancel: () => void; onSaveApi: () => void }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState<string | null>(null)
  return (
    <div>
      {editing ? (
        <>
          <button type="button" onClick={() => { onCancel(); setEditing(false); setRaw(null) }}>
            취소
          </button>
          <button type="button" onClick={onSaveApi}>저장</button>
          <input aria-label="담당 교사 휴대폰" value={raw ?? ''} readOnly />
        </>
      ) : (
        <button type="button" onClick={() => setConfirmOpen(true)}>정보 수정</button>
      )}
      {confirmOpen ? (
        <ConfirmModal
          open={confirmOpen}
          title="정보 수정 안내"
          content="안내"
          confirmText="정보 수정"
          cancelText="취소"
          onConfirm={() => {
            setConfirmOpen(false)
            setRaw('010-1234-5678')
            setEditing(true)
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}
    </div>
  )
}

afterEach(cleanup)

describe('기관 신청 수정 취소 — 한 번 클릭 (Step 5 P1)', () => {
  it('안내 확인 직후 화면에는 헤더 [취소] 하나만 있고, 한 번 클릭으로 편집이 끝나며 원문이 사라진다', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const onSaveApi = vi.fn()
    render(<EditFlowHarness onCancel={onCancel} onSaveApi={onSaveApi} />)

    await user.click(screen.getByRole('button', { name: '정보 수정' }))
    // 안내 확인 창의 [정보 수정](마지막)으로 수정 진입
    await user.click(screen.getAllByRole('button', { name: '정보 수정' }).at(-1)!)

    // 닫힘 애니메이션 레이어가 남지 않는다 → 클릭을 가로챌 모달·두 번째 [취소]가 없다
    expect(document.querySelector('.confirm-modal')).toBeNull()
    expect(screen.getAllByRole('button', { name: '취소' })).toHaveLength(1)
    expect(screen.getByLabelText('담당 교사 휴대폰')).toHaveProperty('value', '010-1234-5678')

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSaveApi).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull()
    expect(screen.queryByLabelText('담당 교사 휴대폰')).toBeNull()
    expect(screen.getByRole('button', { name: '정보 수정' })).toBeTruthy()
  })
})
