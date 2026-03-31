# 정산 항목 상세 모달 — 변형별 UI 스펙 (1급 기준 정렬)

디자인 핸드오프용. 구현은 [`settlement-item-setting-detail-modal.tsx`](../../../src/pages/settlement-management/settlement-item-setting-detail-modal.tsx), [`settlement-item-setting-detail-modal.css`](../../../src/pages/settlement-management/settlement-item-setting-detail-modal.css), [`settlement-item-setting-detail.mock.ts`](../../../src/data/mock/settlement-item-setting-detail.mock.ts)를 기준으로 한다.

## 기준: 1급 강사비 (`w-1`, layout `tier1`)

| 영역 | 스펙 |
|------|------|
| 모달 셸 | `ContentModal` width 800px, **800×715** |
| 헤더 | 아이콘 + 제목, 닫기 X |
| 블록 간격 | 본문 **gap 30px**, 레이블↔컨트롤 **6px** |
| 산정 기준 | Select + 숫자 인풋(suffix) + 라디오, 라디오는 입력 우측 **16px** |
| 금액 | 3열 + 디바이더 1×32px, opacity 0.5 |
| 자격·비고 | 자격 **152px**, 비고 **80px**, 테두리 `#C4CDD1`, 패딩 16×14 |
| 인풋 본문 | `#464646`, Pretendard 16px / 500 / 150% |
| 라디오 | 산정 라디오 15px, 선택 시 민트 |
| 스크롤 | 모달 바디 세로 스크롤 없음, 리치텍스트만 내부 스크롤 |

## 변형 A: 특강 강사비 (`w-4`, layout `simple`)

모달 클래스: `settlement-item-setting-detail-modal--special-lecture`

| 항목 | 스펙 |
|------|------|
| 모달 크기 | **800×618** |
| 산정 기준 | Select만(전체), **180×44** |
| 최대 한도 금액 | 1필드, **180×44** |
| 자격 요건 | **56px** 높이 (`__richtext--qual56`) |
| 비고 | **80px** (`__richtext--remark`) |

**검증**: `basis-row--simple`의 기본 `width: 100%` Select 규칙보다 modifier의 **180px**가 우선하는지 확인.

## 변형 B: 교통비 (`p-1`, layout `transport`)

모달 클래스: `settlement-item-setting-detail-modal--transport`

| 항목 | 스펙 |
|------|------|
| 모달 크기 | **800×715** (1급과 동일) |
| 산정 기준 | 거리 Select + km 인풋 + 라디오, Select·숫자 인풋 각 **180×44** |
| 최대 한도 | 1열 **180×44** |
| 지원 기준 | **104px** (`__richtext--support104`) |
| 비고 | **80px** |
| 증빙 자료 | 필요/불필요 라디오 (`__evidence-radios`) |

**검증**: 산정 라디오 **16px** 간격, `180×44` 시 suffix(km·원) 세로 정렬.

## 공통 (특강·교통비)

- **180×44** Select·한도 인풋 규칙은 CSS에서 **공통 선택자**로 묶어 유지보수한다.
- `w-1` / `w-4` / `p-1` 시각 회귀 시 간격·타이포·리치텍스트 높이를 확인한다.
