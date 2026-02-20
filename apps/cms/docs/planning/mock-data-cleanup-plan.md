# Mock 데이터 정합성 개선 계획서

**작성일**: 2026-02-20
**작성자**: Senior Developer 관점 검토
**대상**: `apps/cms/src/data/mock/` 전체 (43개 파일)

---

## 1. 분석 요약 (Executive Summary)

에이전트 자동 탐색 + 수동 검토를 통해 43개 mock 파일 중 **6개 파일**에서 UI 품질을 저해하는 실질적 문제가 확인됨.
나머지 37개 파일은 구조적으로 안전하거나 의도된 패턴을 따르고 있음.

---

## 2. 문제 파일 및 이슈 목록

### 🔴 우선순위 1 — UI 화면에 직접 노출되는 더미 텍스트 (즉시 수정)

#### `applicant-instructors.ts`
| 위치 | 현재 값 | 문제 |
|---|---|---|
| `INSTRUCTOR_NAMES` | `김틴토`, `이틴토`, ..., `홍틴토` | 테스트용 명칭, 실제 서비스 불가 |
| `INSTRUCTOR_NAMES_HANJA` | `金틴토`, `李틴토`, ... | 한자 + 가짜 이름 혼용 |
| `INSTRUCTOR_NAMES_ENGLISH` | `Kim Tinto`, `Lee Tinto`, ... | 영문 성명 비현실적 |
| `EDUCATION_SCHOOLS` | `틴토대학교`, `틴토전문대학교`, `틴토고등학교`, `틴토대학원` | 가짜 학교명 |
| `contact` (전체 72행) | `'010-0000-0000'` 고정 | 모든 강사 동일 번호 |
| `accountNumber` (전체 72행) | `'12345678901234'` 고정 | 모든 강사 동일 계좌 |
| `careerDetails[0].companyName` | `'ㅁㅁ학습지'` | 의미 없는 ㅁㅁ 약칭 |
| `careerDetails[1].companyName` | `'○○학원'` | 의미 없는 ○○ 약칭 |
| `awards[0].name` | `'OO교육원 웹마스터 915기 교육 수료'` | OO 약칭 |
| `awards[1].name` | `'서울특별시 대통령배 ○○부문 금상'` | ○○ 약칭 |
| `educations[0].major` | `'OO학과'` | OO 약칭 |
| `freeWriting1` (index 0) | Lorem ipsum (영문) | 한국어 UI에 영문 플레이스홀더 |
| `birthDate` | 전원 `XXXX.09.15` | 같은 월일 반복 |
| `oneLineIntro` (일부) | `''` 공란 | 빈 문자열 표시 |

#### `participating-instructors.ts`
위 `applicant-instructors.ts`와 동일한 패턴 공유:
- `INSTRUCTOR_NAMES`: `김틴토`, `이강사`, `박틴토`, `최강사`, `정멘토`, `강틴토`, `조강사`, `윤멘토`, `장틴토`, `임강사`
- `EDUCATION_SCHOOLS`: `틴토대학교`, `틴토전문대학교`, `틴토고등학교`
- `contact: '010-0000-0000'` (index 0에만)
- `careerDetails[0].companyName: 'ㅁㅁ학습지'`
- `careerDetails[1].companyName: '○○학원'`
- `awards`: `'OO교육원 웹마스터 915기 교육 수료'`, `'서울특별시 대통령배 ○○부문 금상'`
- `educations[0].major: 'OO학과'`
- `freeWriting1` (index 0): Lorem ipsum

#### `applicant-schools.ts`
| 위치 | 현재 값 | 문제 |
|---|---|---|
| `TEACHER_NAMES` | `홍길동`, `김길동`, ..., `조길동` | 전형적 테스트명, 모두 `길동` |

#### `participating-schools.ts`
- 동일한 `TEACHER_NAMES` 패턴 예상 (검증 필요)

---

### 🟡 우선순위 2 — 데이터 다양성 부족 (개선 권장)

#### `program-managers.ts`
| 위치 | 현재 값 | 문제 |
|---|---|---|
| `phone` (3개 전원) | `'010-1234-5678'` 동일 | 3명 모두 같은 번호 |
| `registeredAt` (3개 전원) | `'2026.02.10 09:15'` 동일 | 3명 모두 같은 등록일시 |

---

### 🟢 우선순위 3 — 구조적 안전, 경미한 개선 (선택)

| 파일 | 이슈 | 비고 |
|---|---|---|
| `templates.ts` | `html: ''` 빈 문자열 | 의도된 템플릿 기능 |
| `mfa.ts` | OTP 고정 `'123456'` | 개발 편의용, 의도된 것 |
| `settlements.ts` | `as any` 타입 캐스트 | 타입 안전성 이슈, 별도 티켓 |
| 전체 | 생년월일 월일 `09.15` 고정 | 시각적 단조로움이나 기능 영향 없음 |

---

## 3. 수정 전략

### 3.1 이름 교체 방침

**강사명 (20개)**: 실제 한국인 성씨 + 자연스러운 이름으로 교체
→ 성씨는 한국 10대 성씨(김/이/박/최/정/강/조/윤/장/임) 유지, 이름은 자연스럽게 변경

예시:
```
김틴토 → 김서연
이틴토 → 이준혁
최틴토 → 최지원
박틴토 → 박민준
...
```

**교사명 (8개)**: `길동` 패턴 제거, 실제 교사명으로 교체
→ 성씨 다양화: 홍/김/박/이/최/정/강/조 성씨에 다양한 이름 부여

**학교명**: `틴토대학교` → `한성대학교`, `틴토전문대학교` → `서울여자간호대학교`, `틴토고등학교` → `경복고등학교`, `틴토대학원` → `서울대학교 대학원`

### 3.2 더미 텍스트 교체

**회사명**: `ㅁㅁ학습지` → `한솔교육`, `○○학원` → `대교 눈높이학원`

**수상/수료**:
- `OO교육원 웹마스터 915기 교육 수료` → `한국생산성본부 퍼실리테이터 양성과정 수료`
- `서울특별시 대통령배 ○○부문 금상` → `서울특별시 교육청 경제교육 우수 강사상`

**전공**: `OO학과` → `경영학과`

**Lorem ipsum**: 실제 한국어 자기소개 텍스트로 교체 (기존 다른 행에서 활용 가능한 텍스트 유사 작성)

### 3.3 번호 다양화

**전화번호**: 010-XXXX-XXXX 패턴으로 index 기반 다양화
→ 각 행마다 다른 번호 배열에서 순환

**계좌번호**: 한국 은행별 실제 자릿수 기준 (농협 11~16자리)으로 다양화

**등록일시** (program-managers): 같은 날 시간대 다양화 (09:15, 10:30, 14:45 등)

### 3.4 생년월일 다양화

`XXXX.09.15` → 월(01~12), 일(01~28) 범위에서 index 기반 다양화

---

## 4. 수정 파일 목록 및 순서

| 순서 | 파일 | 변경 규모 | 예상 영향 |
|---|---|---|---|
| 1 | `applicant-instructors.ts` | 크게 | 강사 신청자 탭 전체 |
| 2 | `participating-instructors.ts` | 크게 | 진행 현황 강사 탭 전체 |
| 3 | `applicant-schools.ts` | 소규모 | 신청 학교 탭 교사명 |
| 4 | `participating-schools.ts` | 소규모 | 진행 현황 학교 탭 교사명 |
| 5 | `program-managers.ts` | 소규모 | 담당자 탭 연락처/날짜 |

---

## 5. 크로스파일 정합성 체크

수정 후 반드시 확인할 참조 관계:

1. `INSTRUCTOR_SCHOOL_OPTIONS` (participating-instructors) ↔ 학교 배정 선택 UI
2. `INSTRUCTOR_NAMES` 변경 시 `accountHolder` 필드도 동기화 필요
3. `SCHOOL_NAMES` 배열은 applicant-instructors / applicant-schools / participating-instructors가 공유하므로 변경 불필요

---

## 6. 수정 제외 항목 (의도된 패턴)

- `freeWriting4: '-'` — 미작성 상태를 표현하는 의도된 값 ✓
- `틴토에듀` 회사명 — 서비스 브랜드 명칭으로 허용 ✓
- `mfa.ts`의 OTP `'123456'` — 개발용 고정값으로 명시 ✓
- 학교명 (`강서초등학교` 등) — 실제 학교명 기반으로 문제 없음 ✓
- `programs.ts` 전체 — 실제 JA Korea 프로그램 기반 데이터, 수정 불필요 ✓

---

## 7. 실행 계획

```
Phase 1: applicant-instructors.ts 수정
  - 이름 배열 교체 (INSTRUCTOR_NAMES, HANJA, ENGLISH)
  - 학교명 배열 교체 (EDUCATION_SCHOOLS)
  - 연락처 배열 추가 및 동적 할당
  - 계좌번호 배열 추가 및 동적 할당
  - 경력/수상/학력 더미 텍스트 제거
  - Lorem ipsum → 한국어 자기소개 교체
  - 생년월일 다양화

Phase 2: participating-instructors.ts 수정 (Phase 1과 동일 패턴)

Phase 3: applicant-schools.ts + participating-schools.ts 수정 (TEACHER_NAMES 교체)

Phase 4: program-managers.ts 수정 (전화번호·등록일시 다양화)

Phase 5: 검증 — 각 파일 import 확인, 빌드 오류 없음 확인
```
