---
priority: high
category: process
---

# 프로그램 상세 풀페이지 모달 — 탭 UI 스펙 (디자이너 검토 완료 → 개발 위임)

**🎨 시니어 UX/UI 디자이너 검토 완료.** 스크린샷 및 시안 기준으로 탭 영역/탭 항목 스펙을 확정하였습니다. 아래 사양대로 구현해 주세요.

**대상**: `ProgramDetailFullPageModal` 내 메인 영역 탭 (공통 정보, 프로그램 진행 현황, 신청자 목록, 담당자 정보)

**참고 이미지**:  
`assets/Screenshot_2026-03-16_at_2.18.42_PM-*.png`, `assets/Screenshot_2026-03-16_at_2.18.52_PM-*.png`  
(탭 영역 좌측 여백, 활성/비활성 텍스트·밑줄, 패딩 확인용)

---

## 1. 탭 영역(행) 레이아웃

| 항목 | 값 | 비고 |
|------|-----|------|
| **좌측 패딩** | 52px | 탭 영역 전체 좌측 여백 |
| **우측 패딩** | 24px (또는 `var(--spacing-24)`) | 액션 버튼과 간격 |
| **상단 패딩** | 16px (또는 `var(--spacing-16)`) | 헤더와의 간격 |
| **하단** | 구분선(디바이더) **없음** | 탭 하위에 가로 디바이더 금지 |
| **정렬** | 탭은 좌측, 버튼(정보 수정·미리보기)은 우측 | `justify-content: space-between` |

- 구현: `.program-detail-fullpage-modal__tabs-row` 등 해당 컨테이너에 적용.
- **확인 사항**: 전역 `button` 스타일(`index.css`의 `padding: 0.6em 1.2em`)이 탭 버튼을 덮지 않도록, 탭용 버튼에는 더 구체적인 선택자로 패딩을 지정할 것.

---

## 2. 탭 항목(버튼) 패딩

각 탭은 **버튼**이며, 아래 **내부 패딩**이 반드시 적용되어야 합니다. (클릭 영역·시안과 일치)

| 방향 | 값 | 비고 |
|------|-----|------|
| **상** | 6px | |
| **좌·우** | 16px | horizontal 16 |
| **하** | 10px | |

- **적용 대상**: `.program-detail-fullpage-modal__tab` (또는 `button.program-detail-fullpage-modal__tab`).
- **주의**: 전역 button 패딩에 의해 덮어쓰이지 않도록, 모달 스코프 내 구체 선택자 + `box-sizing: border-box` 적용 권장.

---

## 3. 비활성 탭 텍스트 스펙

| 속성 | 값 | 비고 |
|------|-----|------|
| **color** | #7D7D7D | |
| **font-family** | Pretendard (또는 `var(--font-family-primary, 'Pretendard', sans-serif)`) | |
| **font-size** | 18px | |
| **font-style** | normal | |
| **font-weight** | 500 | |
| **line-height** | 150% | (27px) |

- 비활성 탭에는 **하단 보더/밑줄 없음**.

---

## 4. 활성 탭 텍스트 스펙

| 속성 | 값 | 비고 |
|------|-----|------|
| **color** | var(--JA-mint-01, #01A1AF) | |
| **font-family** | Pretendard (동일) | |
| **font-size** | 18px | |
| **font-style** | normal | |
| **font-weight** | 700 | |
| **line-height** | 150% | (27px) |

---

## 5. 활성 탭 하단 밑줄(Underline) UI

- **표시**: 활성 탭에만 표시, **텍스트 너비만큼만** (탭 버튼 전체 너비가 아님).
- **스타일**:
  - 두께: **2px**
  - 색상: **var(--JA-mint-01, #01A1AF)** (또는 #01A1AF)
  - 양끝: **둥글게** (예: `border-radius: 1px` 또는 동일 효과)
- **위치**: 텍스트 바로 아래, 탭 버튼의 하단 패딩(10px) 영역 위에 자연스럽게 오도록.

**구현 참고**: 탭 라벨을 `<span class="program-detail-fullpage-modal__tab-label">` 등으로 감싼 뒤, 활성일 때만 해당 span의 `::after`로 2px 높이·텍스트 너비·청록색·둥근 모서리 막대를 그리면 됨. (전체 너비 `border-bottom` 사용 금지)

---

## 6. 디자이너 검토 체크리스트 (확인 완료)

- [x] 탭 영역 좌측 52px 적용
- [x] 탭 하위 디바이더 제거
- [x] 활성 탭에만 하단 밑줄(텍스트 너비, 2px, #01A1AF, 둥근 끝)
- [x] 활성 탭 텍스트: color #01A1AF, 18px, 700, 150%
- [x] 비활성 탭 텍스트: color #7D7D7D, 18px, 500, 150%
- [x] 탭 항목 패딩: 상 6px, 좌우 16px, 하 10px (전역 button 스타일 오버라이드 필요)

---

## 7. 개발자 구현 시 참고

- **파일**: `apps/cms/src/features/program/ui/program-detail-fullpage-modal.css`, `program-detail-fullpage-modal.tsx`
- **선택자**: 탭 버튼 패딩은 `button.program-detail-fullpage-modal__tab` 등 구체적으로 지정하여 전역 `button` 스타일보다 우선하도록 할 것.
- 기술적으로 위 스펙이 불가한 부분이 있으면, "현재 구조에서는 ~만 가능한데, ~ 방식으로 가면 어떨까요?" 형태로 대안을 제안해 주세요.

---

**마지막 업데이트**: 2026-03 (디자이너 UI 검토 후 스펙 확정·개발 위임)
