# 수료증 양식 등록 폼 기능 확장 - 역할별 협의 문서

**작성일**: 2026-01-28  
**작성자**: AI Assistant (역할별 협의)

---

## 📋 요구사항 요약

수료증 양식 등록 폼에 다음 기능을 추가합니다:
1. **이미지 업로드 기능**: 배경 이미지로 사용할 이미지 업로드
2. **텍스트 오버레이**: 입력한 텍스트를 배경 이미지 위에 배치
3. **PDF 다운로드**: 최종 수료증을 PDF로 다운로드

---

## 👨‍💼 PM 관점: 우선순위 및 일정

### 우선순위
- **P0 (최우선)**: 수료증 양식은 Phase 10 증빙/수료/확인서 관리의 핵심 기능
- **비즈니스 임팩트**: 높음 - 수료증 발급은 프로그램 완료 후 필수 프로세스
- **사용자 영향**: 관리자(운영팀) - 수료증 템플릿 관리 및 발급

### 일정 추정
- **Phase 1 (기본 기능)**: 이미지 업로드 + 미리보기 (2-3일)
- **Phase 2 (텍스트 오버레이)**: 텍스트 편집 및 배치 (3-4일)
- **Phase 3 (PDF 생성)**: PDF 변환 및 다운로드 (2-3일)
- **총 예상 기간**: 7-10일 (개발자 1명 기준)

### 리스크 관리
- **기술적 리스크**: PDF 생성 라이브러리 호환성 (jspdf + html2canvas)
- **대응 방안**: 초기 프로토타입으로 검증 후 진행
- **데이터 모델 변경**: FileTemplateContent 타입 확장 필요

---

## 📋 기획자 관점: 요구사항 명세

### 사용자 시나리오

#### 시나리오 1: 수료증 양식 등록
1. 관리자가 "수료증 양식 등록" 버튼 클릭
2. 기본 정보 입력 (제목, 설명, 상태, 버전 등)
3. **배경 이미지 업로드** (JPG, PNG, 최대 10MB)
4. 이미지 미리보기 확인
5. **텍스트 필드 정의** (예: 수료자 이름, 프로그램명, 발급일 등)
6. 텍스트 위치 및 스타일 설정 (위치, 폰트 크기, 색상)
7. 미리보기에서 최종 확인
8. 저장 후 PDF 다운로드 테스트

#### 시나리오 2: 수료증 발급 (향후)
1. 프로그램 완료 후 수료자 목록 확인
2. 수료증 템플릿 선택
3. 수료자 정보 자동 매핑
4. PDF 생성 및 다운로드

### 기능 명세

#### 1. 이미지 업로드
- **입력**: 이미지 파일 (JPG, PNG, 최대 10MB)
- **처리**: 
  - 파일 유효성 검사 (크기, 형식)
  - 이미지 미리보기 생성
  - 업로드 URL 저장 (현재는 Mock, 추후 서버 연동)
- **출력**: 배경 이미지 URL

#### 2. 텍스트 오버레이
- **입력**: 
  - 텍스트 필드 정의 (이름, 라벨, 기본값)
  - 위치 (x, y 좌표 또는 드래그 앤 드롭)
  - 스타일 (폰트 크기, 색상, 정렬)
- **처리**:
  - 배경 이미지 위에 텍스트 렌더링
  - 실시간 미리보기
- **출력**: 텍스트 필드 정의 JSON

#### 3. PDF 생성
- **입력**: 배경 이미지 + 텍스트 필드 정의
- **처리**:
  - Canvas에 배경 이미지 + 텍스트 렌더링
  - Canvas를 PDF로 변환 (html2canvas + jspdf)
- **출력**: PDF 파일 (Blob)

### 데이터 모델 확장

```typescript
interface FileTemplateContent {
  // 기존 필드
  fileName: string
  mimeType: string
  downloadUrl: string
  version: string
  sizeBytes?: number
  category?: FileTemplateCategory
  
  // 신규 필드 (수료증 전용)
  backgroundImageUrl?: string // 배경 이미지 URL
  textFields?: CertificateTextField[] // 텍스트 필드 정의
}

interface CertificateTextField {
  id: string
  label: string // 필드 라벨 (예: "수료자 이름")
  key: string // 변수 키 (예: "recipientName")
  x: number // X 좌표 (픽셀)
  y: number // Y 좌표 (픽셀)
  fontSize: number // 폰트 크기
  color: string // 텍스트 색상 (hex)
  align: 'left' | 'center' | 'right' // 정렬
  fontFamily?: string // 폰트 패밀리
}
```

---

## 🎨 디자이너 관점: UI/UX 설계

### 디자인 원칙
- **Ant Design 컴포넌트 활용**: 기존 디자인 시스템 준수
- **직관적인 워크플로우**: 업로드 → 편집 → 미리보기 → 저장
- **실시간 피드백**: 이미지 업로드 시 즉시 미리보기

### UI 구성

#### 1. 이미지 업로드 섹션
```
┌─────────────────────────────────────┐
│ 배경 이미지 *                        │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │   [이미지 미리보기 영역]         │ │
│ │   또는                           │ │
│ │   [이미지 업로드 버튼]           │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ JPG, PNG 파일만 업로드 가능 (최대 10MB)│
└─────────────────────────────────────┘
```

#### 2. 텍스트 필드 편집 섹션
```
┌─────────────────────────────────────┐
│ 텍스트 필드 설정                     │
│ ┌─────────────────────────────────┐ │
│ │ 필드명: [수료자 이름]            │ │
│ │ 위치: X [100] Y [200]            │ │
│ │ 폰트 크기: [24] 색상: [#000000] │ │
│ │ 정렬: [왼쪽 ▼]                   │ │
│ │ [추가] [삭제]                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 3. 미리보기 섹션
```
┌─────────────────────────────────────┐
│ 미리보기                             │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │   [배경 이미지 + 텍스트 오버레이] │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ [PDF 다운로드] 버튼                  │
└─────────────────────────────────────┘
```

### 컴포넌트 구조
- `CertificateBackgroundUpload`: 이미지 업로드 컴포넌트
- `CertificateTextFieldsEditor`: 텍스트 필드 편집 컴포넌트
- `CertificatePreview`: 미리보기 컴포넌트
- `CertificatePdfGenerator`: PDF 생성 유틸리티

### 사용자 경험 개선
- **드래그 앤 드롭**: 이미지 업로드 시 드래그 앤 드롭 지원
- **실시간 미리보기**: 텍스트 필드 수정 시 즉시 반영
- **반응형 레이아웃**: 모달 내에서 2단 레이아웃 (편집 영역 + 미리보기)

---

## 👨‍💻 개발자 관점: 기술 구현

### 기술 스택
- **이미지 처리**: HTML5 Canvas API
- **PDF 생성**: 
  - `jspdf`: PDF 생성 라이브러리
  - `html2canvas`: HTML/CSS를 Canvas로 변환
- **파일 업로드**: Ant Design Upload 컴포넌트
- **상태 관리**: React Hook Form + Zustand (필요시)

### 아키텍처 설계

#### 1. 컴포넌트 구조 (FSD)
```
apps/cms/src/
├── features/
│   └── certificate-template/
│       ├── ui/
│       │   ├── certificate-background-upload.tsx
│       │   ├── certificate-text-fields-editor.tsx
│       │   └── certificate-preview.tsx
│       └── model/
│           └── certificate-template-store.ts (필요시)
├── shared/
│   └── utils/
│       └── certificate-pdf-generator.ts
└── pages/
    └── templates/
        └── template-files-page.tsx (수정)
```

#### 2. 주요 함수

```typescript
// PDF 생성 유틸리티
export async function generateCertificatePdf(
  backgroundImageUrl: string,
  textFields: CertificateTextField[],
  fieldValues: Record<string, string>
): Promise<Blob>

// 이미지 로드 및 검증
export function validateImageFile(file: File): Promise<boolean>

// 텍스트 필드 렌더링
export function renderTextOnCanvas(
  canvas: HTMLCanvasElement,
  textFields: CertificateTextField[],
  fieldValues: Record<string, string>
): void
```

### 의존성 설치

```bash
pnpm add jspdf html2canvas
pnpm add -D @types/jspdf
```

### 구현 단계

1. **Phase 1: 이미지 업로드**
   - Upload 컴포넌트 추가
   - 이미지 미리보기
   - 파일 유효성 검사

2. **Phase 2: 텍스트 필드 편집**
   - 텍스트 필드 추가/삭제 UI
   - 위치 및 스타일 설정
   - 실시간 미리보기

3. **Phase 3: PDF 생성**
   - Canvas에 배경 + 텍스트 렌더링
   - PDF 변환
   - 다운로드 기능

### 기술적 고려사항
- **이미지 크기 제한**: 10MB (브라우저 메모리 고려)
- **Canvas 해상도**: PDF 품질을 위해 고해상도 설정 (300 DPI)
- **폰트 로딩**: 커스텀 폰트 사용 시 PDF에 포함 필요
- **CORS 이슈**: 외부 이미지 URL 사용 시 CORS 설정 필요

---

## ✅ 승인 및 다음 단계

### 승인 사항
- [x] PM: 우선순위 및 일정 승인
- [x] 기획자: 요구사항 명세 승인
- [x] 디자이너: UI/UX 설계 승인
- [x] 개발자: 기술 구현 계획 승인

### 다음 단계
1. 의존성 설치 (jspdf, html2canvas)
2. 타입 정의 확장 (FileTemplateContent)
3. 이미지 업로드 컴포넌트 구현
4. 텍스트 필드 편집 컴포넌트 구현
5. PDF 생성 유틸리티 구현
6. 통합 테스트

---

**마지막 업데이트**: 2026-01-28
