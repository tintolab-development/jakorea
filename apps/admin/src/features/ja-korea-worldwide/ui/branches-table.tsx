/**
 * JA Worldwide — 고정 지부명 + 연결 링크 (2열 50%/50%)
 * 시안 셀 스펙(flex)은 table-cell에 못 쓰므로 row flex로 구현
 */

import type { WorldwideBranch, WorldwideBranchId } from '@/entities/ja-korea-worldwide/model/types'
import { CmsInput } from '@/shared/ui'

type BranchesTableProps = {
  branches: WorldwideBranch[]
  mode: 'view' | 'edit'
  onChangeLink: (id: WorldwideBranchId, linkUrl: string) => void
}

export function BranchesTable({ branches, mode, onChangeLink }: BranchesTableProps) {
  return (
    <div className="ja-worldwide-table-wrap" role="region" aria-label="지부 연결 링크">
      <div className="ja-worldwide-branches" role="table">
        <div className="ja-worldwide-branches__row ja-worldwide-branches__row--head" role="row">
          <div className="ja-worldwide-branches__cell ja-worldwide-branches__cell--head" role="columnheader">
            지부명
          </div>
          <div className="ja-worldwide-branches__cell ja-worldwide-branches__cell--head" role="columnheader">
            연결 링크
          </div>
        </div>
        {branches.map(branch => (
          <div key={branch.id} className="ja-worldwide-branches__row" role="row">
            <div className="ja-worldwide-branches__cell" role="cell">
              {branch.name}
            </div>
            <div className="ja-worldwide-branches__cell" role="cell">
              {mode === 'edit' ? (
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  value={branch.linkUrl}
                  onChange={e => onChangeLink(branch.id, e.target.value)}
                  placeholder="연결 링크를 입력하세요"
                  aria-label={`${branch.name} 연결 링크`}
                />
              ) : (
                <span className="ja-worldwide-branches__url">{branch.linkUrl || '-'}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
