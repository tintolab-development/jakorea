# 다음 컨텍스트를 위한 지시사항 프롬프트

**작성 일자**: 2024-12-19  
**목적**: 새로운 컨텍스트에서 작업을 이어가기 위한 명확한 지시사항

---

## 📋 현재 완료된 작업 요약

### ✅ 완료된 Phase

1. **Phase 0**: 프로젝트 초기 설정
2. **Phase 1**: 기반 구조 & 핵심 도메인 모델
3. **Phase 2**: 프로그램 & 신청 관리
4. **Phase 3**: 매칭 & 일정 관리
5. **V3 Phase 7**: 신청 경로 관리
6. **V3 Phase 8**: 일정 협의 관리
7. **V3 Phase 4**: 정산 관리 고도화 (방금 완료)

### 🔄 최근 완료 작업 (V3 Phase 4)

**완료된 기능:**
- ✅ 지급조서 PDF 생성 기능 추가 (Excel/PDF 선택 가능)
- ✅ 개인정보 동의 확인 UI 개선 (PaymentInfoSection 컴포넌트)
- ✅ 지급정보 재사용 기능 (payment-info-service)
- ✅ 월별 정산 일괄 다운로드 기능
- ✅ 교통비/숙박비 자동 계산 로직 개선 (일사일교 사업 특수성 반영)
- ✅ e-count 전자결제 연동 인터페이스 설계

**생성된 파일:**
- `apps/cms/src/entities/settlement/model/payment-info.ts` - 지급정보 타입 정의
- `apps/cms/src/entities/settlement/api/payment-info-service.ts` - 지급정보 서비스
- `apps/cms/src/features/settlement/ui/payment-info-section.tsx` - 지급정보 UI 컴포넌트
- `apps/cms/src/entities/settlement/api/ecount-integration.ts` - e-count 연동 인터페이스
- `apps/cms/src/shared/utils/settlement-document.ts` - PDF 생성 기능 추가

**수정된 파일:**
- `apps/cms/src/shared/constants/settlement-rules.ts` - 일사일교 사업 특수성 추가
- `apps/cms/src/entities/settlement/lib/settlement-calculation.ts` - 계산 로직 개선
- `apps/cms/src/features/settlement/ui/settlement-detail-drawer.tsx` - 지급정보 섹션 추가
- `apps/cms/src/pages/settlements/monthly-settlement-page.tsx` - 일괄 다운로드 기능 추가

---

## 🎯 다음 우선순위 작업

### Phase 6: 공문 관리 (🟡 높음)

**요구사항:**
- 공문 목록 페이지
- 공문 생성/수정 폼 (프로그램 다중 선택, 템플릿 선택)
- 공문 미리보기
- 공문 다운로드 (PDF/Word)
- 공문 템플릿 관리

**참고 문서:**
- `apps/cms/docs/interview/CLIENT_INTERVIEW_2024-12-19.md` - Phase 6
- `apps/cms/docs/roadmap/MVP_ROADMAP_V3.md` - Phase 6 상세 요구사항

**확인 필요 사항:**
- 템플릿 구조 정의 필요
- PDF/Word 다운로드 포맷 확인

---

### Phase 10: 증빙/수료/확인서 관리 (🟡 높음)

**요구사항:**
- 증빙 문서 목록 페이지
- 증빙 문서 생성 화면 (봉사 확인증, 강사 확인증, 수료증)
- 증빙 문서 템플릿 관리
- 수료증 배경 이미지 업로드/변경
- 증빙 문서 미리보기
- 증빙 문서 다운로드 (PDF)

**참고 문서:**
- `apps/cms/docs/interview/CLIENT_INTERVIEW_2024-12-19.md` - Phase 10
- `apps/cms/docs/roadmap/MVP_ROADMAP_V3.md` - Phase 10 상세 요구사항

**확인 필요 사항:**
- 수료증 배경 이미지 변경 가능 여부 확인
- 이미지 포맷/크기 제한 확인

---

### Phase 11: 어드민 커스터마이징 (🟡 높음)

**요구사항:**
- 메인 팝업 관리 화면 (최대 3개, 사이즈 3가지 모듈 구조)
- 콘텐츠 관리 화면 (이미지 업로드, 텍스트 편집, 사진 교체)
- 임팩트 스토리 관리 화면
- 문의 목록 페이지 (카테고리별 필터, 상태별 필터)
- 문의 상세 화면 (담당자 할당, 처리 상태 변경, 전화/회신 기록)
- 문의 알림 기능 (이메일 알림, 어드민 내 알림)
- 다운로드 목록 페이지 (카테고리별 분류, 다운로드 링크 크기 개선)
- 다운로드 통계 화면 (월별 다운로드 카운트)

**참고 문서:**
- `apps/cms/docs/interview/CLIENT_INTERVIEW_2024-12-19.md` - Phase 12
- `apps/cms/docs/roadmap/MVP_ROADMAP_V3.md` - Phase 11 상세 요구사항

---

### Phase 9: 예산 및 실적 관리 (🟢 중간)

**요구사항:**
- 프로그램별 예산 설정 화면
- 지역별 구분 관리
- 실적 집계 대시보드 (월별, 지역별, 프로그램별)
- 특수 기준 설정 (농어촌 등)

**참고 문서:**
- `apps/cms/docs/interview/CLIENT_INTERVIEW_2024-12-19.md` - Phase 9
- `apps/cms/docs/roadmap/MVP_ROADMAP_V3.md` - Phase 9 상세 요구사항

---

### Phase 5: 사용자 화면 기반 UI 개선 (🟢 중간)

**요구사항:**
- 프로그램 상세 화면 개선
- 신청 결과 화면 개선 (승인 대기, 반려, 승인 완료)
- 마이페이지 메인 화면 개선
- To-do 처리 화면
- 내 일정 목록 화면 개선
- 일정 상세 화면 개선
- 강의 상세 화면 개선
- 봉사 상세 화면 개선
- 보고서 작성 화면
- 이력 목록 화면
- 이력 상세 / 증빙 화면

**참고 문서:**
- `apps/cms/docs/roadmap/MVP_ROADMAP_V2.md` - Phase 5
- `apps/cms/docs/roadmap/MVP_ROADMAP_V3.md` - Phase 5 상세 요구사항

---

## 📝 다음 작업 시작 시 지시사항

### 1. 현재 상태 확인

```markdown
다음 Phase를 진행하기 전에:
1. `apps/cms/docs/status/PROGRESS.md` 파일을 확인하여 완료된 작업 확인
2. `apps/cms/docs/status/NEXT_PHASE_CHECKLIST.md` 파일을 확인하여 다음 작업 확인
3. 해당 Phase의 상세 요구사항 문서 확인
```

### 2. Phase 6 시작 시 프롬프트

```
Phase 6: 공문 관리 기능을 구현해줘.

요구사항:
- 공문 목록 페이지 구현
- 공문 생성/수정 폼 (프로그램 다중 선택, 템플릿 선택)
- 공문 미리보기 기능
- 공문 다운로드 (PDF/Word)
- 공문 템플릿 관리

참고 문서:
- apps/cms/docs/interview/CLIENT_INTERVIEW_2024-12-19.md (Phase 6)
- apps/cms/docs/roadmap/MVP_ROADMAP_V3.md (Phase 6)

구현 순서:
1. 공문 타입 정의 및 Mock 데이터 생성
2. 공문 서비스 및 스토어 구현
3. 공문 목록 페이지 구현
4. 공문 생성/수정 폼 구현
5. 공문 템플릿 관리 기능 구현
6. PDF/Word 다운로드 기능 구현

기존 패턴 준수:
- FSD 구조 (entities, features, pages)
- Zustand 스토어 사용
- react-hook-form + zod 스키마
- Ant Design 컴포넌트 활용
- 쿼리 파라미터 동기화 (useQueryParams)
```

### 3. Phase 10 시작 시 프롬프트

```
Phase 10: 증빙/수료/확인서 관리 기능을 구현해줘.

요구사항:
- 증빙 문서 목록 페이지
- 증빙 문서 생성 화면 (봉사 확인증, 강사 확인증, 수료증)
- 증빙 문서 템플릿 관리
- 수료증 배경 이미지 업로드/변경
- 증빙 문서 미리보기
- 증빙 문서 다운로드 (PDF)

참고 문서:
- apps/cms/docs/interview/CLIENT_INTERVIEW_2024-12-19.md (Phase 10)
- apps/cms/docs/roadmap/MVP_ROADMAP_V3.md (Phase 10)

구현 순서:
1. 증빙 문서 타입 정의 및 Mock 데이터 생성
2. 증빙 문서 서비스 및 스토어 구현
3. 증빙 문서 목록 페이지 구현
4. 증빙 문서 생성 화면 구현
5. 수료증 배경 이미지 관리 기능 구현
6. PDF 생성 기능 구현 (jsPDF 또는 서버 API)
```

### 4. Phase 11 시작 시 프롬프트

```
Phase 11: 어드민 커스터마이징 기능을 구현해줘.

요구사항:
- 메인 팝업 관리 화면 (최대 3개, 사이즈 3가지 모듈 구조)
- 콘텐츠 관리 화면 (이미지 업로드, 텍스트 편집, 사진 교체)
- 임팩트 스토리 관리 화면
- 문의 목록 페이지 (카테고리별 필터, 상태별 필터)
- 문의 상세 화면 (담당자 할당, 처리 상태 변경, 전화/회신 기록)
- 문의 알림 기능 (이메일 알림, 어드민 내 알림)
- 다운로드 목록 페이지 (카테고리별 분류, 다운로드 링크 크기 개선)
- 다운로드 통계 화면 (월별 다운로드 카운트)

참고 문서:
- apps/cms/docs/interview/CLIENT_INTERVIEW_2024-12-19.md (Phase 12)
- apps/cms/docs/roadmap/MVP_ROADMAP_V3.md (Phase 11)

구현 순서:
1. 각 기능별 타입 정의 및 Mock 데이터 생성
2. 서비스 및 스토어 구현
3. UI 컴포넌트 구현
4. 통합 및 테스트
```

---

## 🔧 기술 스택 및 패턴

### 현재 사용 중인 기술 스택
- **Frontend**: React + TypeScript + Vite
- **UI 라이브러리**: Ant Design 5.28.0
- **상태 관리**: Zustand
- **폼 관리**: react-hook-form + zod
- **테이블**: @tanstack/react-table
- **문서 생성**: ExcelJS (Excel), jsPDF 필요 (PDF)
- **파일 다운로드**: file-saver

### 프로젝트 구조 (FSD)
```
apps/cms/src/
├── app/              # 라우팅, 레이아웃
├── pages/            # 페이지 컴포넌트
├── features/         # 기능별 모듈 (UI, hooks, model)
├── entities/         # 도메인 엔티티 (API, model)
├── shared/           # 공통 유틸리티, 컴포넌트
└── data/mock/        # Mock 데이터
```

### 코딩 규칙
- 파일명: 케밥케이스 (kebab-case)
- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 타입: PascalCase (인터페이스, 타입)
- 쿼리 파라미터 동기화 필수 (useQueryParams 훅 사용)

---

## 📚 주요 참고 문서 위치

### 진행 상황 및 로드맵
- `apps/cms/docs/status/PROGRESS.md` - 전체 진행 상황
- `apps/cms/docs/status/NEXT_PHASE_CHECKLIST.md` - 다음 Phase 체크리스트
- `apps/cms/docs/roadmap/MVP_ROADMAP_V3.md` - V3 로드맵 상세
- `apps/cms/docs/interview/CLIENT_INTERVIEW_2024-12-19.md` - 클라이언트 인터뷰 정리

### 프로젝트 규칙
- `.cursor/rules/project-system-prompt.md` - 프로젝트 시스템 프롬프트
- `.cursor/rules/coding-standards.md` - 코딩 표준
- `.cursor/rules/design-guidelines.md` - 디자인 가이드라인
- `apps/cms/.cursor/rules/` - CMS 전용 규칙

---

## ⚠️ 주의사항

### 보안 및 개인정보
- 주민등록번호, 계좌번호 등 민감정보는 마스킹 처리 필수
- 개인정보 동의 확인 UI 필수
- 지급정보는 권한자만 확인 가능하도록 구현

### FORBIDDEN 원칙
- 정산 자동 승인 금지
- 개인정보 무단 노출 금지
- 지급정보 무단 변경 금지
- 공문 내용 자동 생성 금지 (수동 입력 필수)
- 일정 자동 확정 금지 (협의 필수)

### 확인 필요 사항
각 Phase 시작 전 다음 사항 확인:
- 담당자 실무 확인 필요 사항
- 외부 연동 방식 확인 (e-count, 템플릿 구조 등)
- 정책 문서 확인 (교통비/숙박비 계산 룰 등)

---

## 🚀 빠른 시작 가이드

### 다음 Phase 시작 시 체크리스트

1. **문서 확인**
   - [ ] 해당 Phase의 상세 요구사항 문서 확인
   - [ ] 클라이언트 인터뷰 내용 확인
   - [ ] 기존 구현 패턴 확인 (비슷한 기능 참고)

2. **데이터 구조 설계**
   - [ ] 타입 정의 (domain.ts)
   - [ ] Zod 스키마 생성
   - [ ] Mock 데이터 생성

3. **서비스 및 스토어 구현**
   - [ ] API 서비스 구현 (entities/*/api/)
   - [ ] Zustand 스토어 구현 (features/*/model/)

4. **UI 컴포넌트 구현**
   - [ ] 목록 페이지 (pages/)
   - [ ] 폼 컴포넌트 (features/*/ui/)
   - [ ] 상세 Drawer (필요 시)

5. **통합 및 테스트**
   - [ ] 라우팅 확인
   - [ ] 쿼리 파라미터 동기화
   - [ ] 문서 업데이트 (docs/status/PROGRESS.md)

---

## 💡 팁

### 기존 구현 패턴 참고
- **신청 경로 관리** (Phase 7) → 공문 관리 (Phase 6) 참고 가능
- **일정 협의 관리** (Phase 8) → 문의 관리 (Phase 11) 참고 가능
- **정산 관리** (Phase 4) → 증빙 문서 관리 (Phase 10) 참고 가능

### 공통 컴포넌트 활용
- `@/shared/ui/` - 공통 UI 컴포넌트
- `@/shared/hooks/use-query-params` - 쿼리 파라미터 동기화
- `@/shared/utils/error-handler` - 에러 처리 유틸리티

---

**마지막 업데이트**: 2026-01-22
**다음 작업 예정**: Phase 6 (공문 관리) 또는 Phase 10 (증빙/수료/확인서 관리)
