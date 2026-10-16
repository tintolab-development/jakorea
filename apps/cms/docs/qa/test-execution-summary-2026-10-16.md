# CMS 테스트 실행 결과 정리

- 작성일: 2026-10-16
- 대상: `apps/cms`
- 브랜치: `keonhee`
- 기준 커밋: `3796a02b6`

## 1. 테스트 범위

이번 작업에서는 다음 범위를 검증했습니다.

- CMS 프로그램 생성부터 Platform 역할별 신청까지의 통합 E2E
- 기관·강사·봉사자 승인·반려 후 프로그램 진행 단계까지의 통합 E2E
- UJAT 공통정보 저장 후 재조회 왕복
- 교육받은 교사 자동입력 필수값
- 교육받은 교사 모집 저장 스키마
- CMS 전체 단위 테스트, 타입체크, lint, 빌드

## 2. Platform 역할별 신청 통합 E2E

### 대상 테스트

| 테스트 | 검증 내용 | 결과 |
| --- | --- | --- |
| `cms-platform-application-flow.spec.ts` | CMS에서 생성한 일반 기관 프로그램을 Platform에서 기관·강사·봉사자 계정으로 신청 | 통과 |
| `platform-existing-program-application-expansion.spec.ts` | 기존 E2E 프로그램에 대해 역할별 신청 가능 여부와 모집 매핑 검증 | 통과 |
| `cms-approval-progress-flow.spec.ts` | 기관·강사·봉사자 승인·반려, 일정·강사 배정, 진행 현황 진입 검증 | 통과 |

### 확인된 항목

- 프로그램 생성 후 `programId` 확보
- 모집별 `recruitmentId`, `applicationType`, `formBindingId` 매핑
- 기관 신청과 무관한 강사·봉사자 신청 독립성
- 단일·복수 회차 일정 선택
- 신청 성공 후 새로고침 및 마이페이지 목록 재조회
- 기관·강사·봉사자 승인 및 반려 상태 전이
- 승인된 participant와 일정·강사 배정 정보
- 진행 현황에서 승인 대상 노출 및 반려 대상 제외
- 일반 기관 프로그램 출석 대상에서 실제 배정 일정만 사용

통합 E2E 실행 묶음은 총 5개 spec이 통과했습니다. 테스트 프로그램명은 실행 시각과 랜덤 suffix를 사용해 중복을 피하도록 구성했습니다.

관련 파일:

- `apps/cms/tests/e2e/flows/integration/cms-platform-application-flow.spec.ts`
- `apps/cms/tests/e2e/flows/integration/platform-existing-program-application-expansion.spec.ts`
- `apps/cms/tests/e2e/flows/integration/cms-approval-progress-flow.spec.ts`

## 3. 실패 테스트 확인 및 수정

초기 CMS 전체 테스트에서 4개 테스트가 실패했습니다.

| 실패 영역 | 원인 | 조치 |
| --- | --- | --- |
| UJAT 공통정보 왕복 2건 | 테스트 fixture가 오래된 `registration.overlay`만 제공하고 canonical `ujatRegionCapacities`를 제공하지 않음 | fixture에 서버 canonical 정원 응답 추가 |
| 교육받은 교사 자동입력 1건 | 교육 연수 일정 필드에 날짜만 있고 필수 시간 정보가 없음 | 연수 일정 필드에는 시간 포함 일정 사용 |
| 교육받은 교사 모집 저장 스키마 1건 | 테스트가 `startDate`, `endDate` 구 필드명을 사용 | `participantProgramOperationStartDate`, `participantProgramOperationEndDate`로 수정 |

중요하게 UJAT production adapter에는 이전 overlay를 canonical 응답의 fallback으로 다시 사용하는 변경을 하지 않았습니다. 서버 canonical 필드를 기준으로 동작하도록 테스트 fixture를 보정했습니다.

## 4. 수정 후 단위·회귀 테스트

### 수정 대상 테스트

실행 명령:

```bash
pnpm --filter cms exec vitest run \
  src/features/program/ujat/lib/common-info-save-roundtrip.test.ts \
  src/features/program/shared/lib/apply-dev-program-registration-autofill-trained-teachers.test.ts \
  src/features/program/general/lib/program-recruitment-save-fields.test.ts \
  --reporter=verbose
```

결과:

- 테스트 파일: 3 passed
- 테스트: 11 passed

### 연관 회귀 테스트

실행 대상:

- UJAT adapter
- 교육받은 교사 필수 필드
- 일반 프로그램 자동입력 케이스

결과:

- 테스트 파일: 3 passed
- 테스트: 64 passed

## 5. CMS 전체 테스트

실행 명령:

```bash
pnpm --filter cms test -- --reporter=dot
```

최종 결과:

- 테스트 파일: 710 passed
- 테스트: 4,133 passed
- 스킵: 2
- 실패: 0

초기 실패 4건은 수정 후 전체 테스트에서 재발하지 않았습니다.

## 6. 정적 검증

| 검증 | 결과 |
| --- | --- |
| `pnpm --filter cms typecheck` | 통과 |
| 수정 파일 ESLint | 통과 |
| 저장소 commit hook 전체 typecheck | 통과 |
| 저장소 commit hook 전체 lint | 오류 0건, 기존 warning 존재 |
| `git diff --check` | 통과 |
| `pnpm --filter cms exec vite build` | 통과 |

저장소 전체 lint에는 기존 warning이 포함되어 있습니다. 이번 변경으로 추가된 lint error는 없습니다.

## 7. 백엔드 검증 결과와 프론트 검증 구분

이전 백엔드 검증 공유 결과에는 다음 계약 테스트가 포함되어 있었습니다.

- 기관 신청 상세 데이터 정합성
- 출석 일정 scope 분리
- participant 완료 근거 재계산
- canonical application route
- 알림 예약 시각
- 관리자 첨부 파일 크기 제한
- 신청 결정 상태 일관성
- OpenAPI route 계약

해당 항목은 백엔드 측에서 공유된 결과이며, 이 문서의 CMS 프론트 테스트 결과와 구분합니다. 백엔드에서 장시간 대기로 중단된 회귀 테스트 묶음은 성공으로 간주하지 않았습니다.

## 8. 현재 상태 및 미검증 범위

현재 프론트 작업 기준으로는 CMS 전체 단위 테스트와 통합 E2E가 통과했습니다.

다음 항목은 이번 실행 결과에 포함하지 않았습니다.

- 운영/스테이징 환경에서의 실제 사용자 계정 E2E
- 승인 이후 실제 출석 입력, 이수율, 프로그램 완료 판정
- 파일 스캔 서비스의 비동기 완료까지 포함한 운영 업로드 검증
- 백엔드 Postgres/MockMvc 장시간 회귀 테스트의 완료 결과

## 9. 관련 커밋

| 커밋 | 내용 |
| --- | --- |
| `d150da551` | 교육받은 교사 자동입력 시 시간 포함 연수 일정 보완 |
| `b29d73acf` | UJAT 왕복 테스트에 canonical 정원 응답 반영 |
| `3796a02b6` | 교육받은 교사 모집 저장 스키마 fixture 갱신 |
| `037759119` | 승인·진행 통합 E2E 안정화 |
| `571b2dbff` | Platform 신청 통합 E2E 안정화 |

위 커밋은 `origin/keonhee`에 푸시되어 있습니다.

