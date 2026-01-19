# MVP 버전 로드맵 (Frontend + Mock)

> 본 문서는 `requirements.md`를 **정확히** 반영한 프론트엔드 MVP 로드맵입니다.
> 모든 기능 ID, 상태값, 역할 체계, 산식은 요구사항 원문과 일치합니다.

---

## 기준 원칙

1. **역할 체계**: 요구사항 그대로 적용
   - 프론트 사용자: `개인(참여자)` / `학교` / `강사`
   - 관리자: `마스터 관리자` / `관리자` / `일반`
   - 관리자 프로그램 역할: `담당자` / `파트너` / `보조`

2. **상태값**: 요구사항 §3.3 그대로 적용
   ```
   신청(접수) → 매칭 진행중 → 매칭 완료 → 교재 배송 준비중 →
   교재 발송 완료 → 교육 실시 → 만족도 조사 제출 → 강의보고서 제출
   ```

3. **기능 우선순위**: P0 > P1 > P2 > P3

4. **Hook 분리 원칙**: 모든 비즈니스 로직은 Custom Hook으로 분리

---

## 버전 목록

| 버전 | 제목 | 주요 요구사항 |
|------|------|--------------|
| v0.1 | 인증/역할/기본 구조 | FR-B01, FR-B02, §2 역할 정의 |
| v0.2 | 프론트 사용자 핵심 흐름 | FR-C01~C04, FR-D01, FR-E01~E03 |
| v0.3 | 관리자 운영 기능 | FR-F00~F03, §백오피스 권한 |
| v0.4 | 정산/지급/실적 | FR-G01, FR-G03, 별첨2 산식 |
| v0.5 | 보안/컴플라이언스 | NFR-SEC-*, NFR-DATA-*, NFR-PRIV-* |

---

## 파일 목록

- `v0.1-foundation.md` : 인증/역할/기본 데이터 모델
- `v0.2-front-core.md` : 사용자(개인/학교/강사) 핵심 신청 흐름
- `v0.3-admin-ops.md` : 관리자 승인/매칭/상태 운영
- `v0.4-settlement-report.md` : 정산/지급조서/실적 데이터
- `v0.5-security-compliance.md` : 보안/개인정보/다운로드 통제

---

## 현재 구현 대비 주요 변경점

### 1. 역할 체계 변경 (필수)
```
변경 전: ADMIN / INSTRUCTOR / STUDENT / VOLUNTEER
변경 후:
  - 프론트: INDIVIDUAL(개인) / SCHOOL(학교) / INSTRUCTOR(강사)
  - 관리자: MASTER / ADMIN / GENERAL
  - 프로그램 역할: OWNER(담당자) / PARTNER(파트너) / ASSISTANT(보조)
```

### 2. 상태값 정렬 (필수)
```typescript
// 요구사항 §3.3 기준
type ApplicationStatus =
  | 'RECEIVED'           // 신청(접수)
  | 'MATCHING_IN_PROGRESS' // 매칭 진행중
  | 'MATCHING_COMPLETED'   // 매칭 완료
  | 'MATERIAL_PREPARING'   // 교재 배송 준비중
  | 'MATERIAL_SHIPPED'     // 교재 발송 완료
  | 'IN_PROGRESS'          // 교육 실시
  | 'SURVEY_SUBMITTED'     // 만족도 조사 제출
  | 'REPORT_SUBMITTED'     // 강의보고서 제출
```

### 3. 정산 산식 적용 (별첨2 기준)
```typescript
// 강사비 지급기준 (편도 100km 기준 = 파주시청 ↔ 용인시청)
const INSTRUCTOR_FEE = {
  1: { base: 120000, longDistance: 140000 },
  2: { base: 170000, longDistance: 190000 },
  3: { base: 220000, longDistance: 240000 },
  4: { base: 270000, longDistance: 290000 },
  5: { base: 320000, longDistance: 340000 },
  6: { base: 370000, longDistance: 390000 },
}

// 교통비: 60km 초과 시만 지급
// 숙박비: 해당자 일괄 80,000원
// 원천징수: 사업소득자 3.3% / 비사업소득자 8.8%
```
