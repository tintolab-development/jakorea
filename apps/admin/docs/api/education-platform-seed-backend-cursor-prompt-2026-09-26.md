# Cursor prompt — 교육 소개 Platform SSOT DB 시드 (백엔드)

아래 지시를 **Homepage Admin 백엔드 레포(`JAHOMEADMINBACK`, 로컬 `localhost:8081`)에서만 실행**하라.  
프론트 레포(`jakorea`)는 탐색·수정하지 마라. 값·path·해시는 이 문서만 사용하라.  
질문이 필요하면 스키마·asset purpose·MinIO·15MB 제한이 값을 거부할 때만 하라.

이 문서는 프론트 레포 경로:

`apps/admin/docs/api/education-platform-seed-backend-cursor-prompt-2026-09-26.md`

관련 API 문서(별도):

`apps/admin/docs/api/public-education-introduction-api-backend-cursor-prompt-2026-09-26.md`

값의 기준은 Platform 교육 소개 4페이지와 `/education/textbooks` (2026-09-26)다.  
Admin localStorage mock·2026-09-20 합본의 **짧은 요약 문장**은 SSOT가 아니다.  
대상 코드는 `PRESCHOOL` 등 대문자 enum이다. `preschool` 소문자로 넣지 마라.

API path는 이미 있다. 테이블·엔드포인트를 새로 만들지 마라.  
목록 item에 `unitCount`·`sessionDescription` 이 없으면 API 문서대로 그 두 필드만 목록 스키마에 추가한 뒤 시드하라.

---

## Goal

로컬/dev Homepage DB의 교육 소개가 Platform 화면과 같게 한다. 프로그램 이미지는 **실파일 HTTP 200**이다.

완료 조건:

1. 무토큰 program-intros 4건의 `heroText`·섹션 문장이 이 문서와 **문자 단위 동일**하다.
2. 섹션 수: 진로·경제·기업가 **3**, 디지털 **2**. `sectionKey` 는 아래 표와 같다.
3. 프로그램 이미지 21장의 `publicUrl` curl이 HTTP 200이고 SHA-256·바이트가 아래 표와 같다.
4. overview `introText` 가 교재 히어로 문장과 같다. 사업분야 4, 대상 5.
5. 공개 교재는 **8건**. 제목 집합이 아래와 같다. 구 Admin 제목은 공개에 없다.
6. 시드는 **idempotent**. 두 번 실행해도 fieldCode 4문서·사업분야 4·대상 5·교재 8·에셋(파일명당 1)이 늘지 않는다. TRUNCATE 금지.
7. 이 8제목이 아닌 기존 교재는 `enabled=false`. DELETE 하지 마라.
8. **local/dev 전용.** prod Flyway·앱 기동·repeatable migration이 이 SQL·업로드를 자동 실행하지 않는다.
9. Admin/Platform 프론트 파일은 수정하지 않는다.

```bash
curl -sS 'http://localhost:8081/api/public/education/program-intros/CAREER_EMPLOYMENT'
curl -sS 'http://localhost:8081/api/public/education/overview'
curl -sS 'http://localhost:8081/api/public/education/textbooks?page=0&size=20'
```

---

## Out of scope / 금지

- API path·DTO 이름 변경 (`program-intros` 를 `programs` 로 바꾸기 포함)
- 갤러리 크롭, object-position, 히어로 영문 라벨을 DB에 저장
- `_qa-full.png`, `_qa-split.png` 업로드
- 프로그램 갤러리 이미지를 교재 썸네일로 재사용
- `compositions[]` 컬럼
- 교재가 아닌 디렉터리 짝 제목(`아이디어 랩`, `용돈 관리 교실`, `안전한 온라인`, `정보 판별 트레이닝`, `나의 진로 설계`, `꿈 찾기 워크북`, `미니 비즈니스 챌린지`, `진로 프로그램 신청 안내`) 시드
- 구 교재 제목을 공개로 남기기: `나의 진로 찾기`, `스타트업 챌린지`, `스마트 디지털 시민`, `생활 금융 마스터`, `꿈 키우기 워크북`, `미니 기업가 교실`
- `publicUrl` / 컬럼에 `http://localhost:9000/...` 저장. 조회 시 storage key에서 만든다
- TRUNCATE, 교재 DELETE
- prod 마이그레이션

---

## 시드 규칙

스크립트:

- `scripts/seed_education_program_intros_local.sql` (없으면 생성)
- 기존 `scripts/seed_education_business_catalog_local.sql`
- 기존 `scripts/seed_education_targets_local.sql`
- 기존 `scripts/seed_education_textbooks_local.sql`

값은 이 문서가 SSOT. 파일명은 기존 패턴을 재사용해도 된다.

1. 프로그램 소개: `fieldCode` 4건 UPSERT. 섹션은 `sectionKey` UPSERT. 없는 섹션은 그 문서에서 제거하지 말고, 이 문서에 없는 sectionKey는 공개 정렬에서 빠지게 `sortOrder` 를 비우거나 행을 남기되 공개 배열에는 아래 키만 나오게 하라. DELETE 보다 비공개가 나으면 비공개.
2. 사업분야 4코드: 없으면 INSERT, 있으면 id 유지. 문구·순서·enabled=true UPDATE.
3. 대상 5코드: 없으면 INSERT, 있으면 id 유지. **이름만** UPDATE. 색·순서 컬럼이 있으면 유지.
4. 교재: 제목+분야 UPSERT. 구 제목은 enabled=false.
5. 이미지: `homepage_asset` READY. 키 예 `local/seed/education-intro/{파일명}`.

실행 예:

```bash
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_education_business_catalog_local.sql
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_education_targets_local.sql
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_education_textbooks_local.sql
docker exec -i jakorea-postgres \
  psql -U postgres -d jakorea < scripts/seed_education_program_intros_local.sql
```

DB 이름이 `jakorea` 가 아니면 Homepage가 쓰는 DB를 써라.

---

## 에셋 (프로그램 소개 21장)

프론트 레포 `jakorea` 에서 복사. placeholder 1장 재사용 금지.

| 파일 | bytes | SHA-256 |
|------|------:|---------|
| explore-lecture.jpg | 328260 | `3df892216dc82bd795c4e8ac86ded2ff14fb5aa5ecd2181e46b05348e1ba7241` |
| explore-workshop.jpg | 475032 | `9b210a73a933cb1d6df8a1b443e8724b22ff1f6fa1bff257c6a8b1aef8d8d753` |
| experience.jpg | 9646733 | `df8bd2779f3622e9bf5a8833a8e29d94f359bc91295237536ff4ca64ecc7e95a` |
| strengthen-barista.jpg | 9264520 | `b8e1911ea3301aa2e2bb8a335f155dfb9b05a8315d02008fc8ab5bd48e107b46` |
| strengthen-mentoring.jpg | 6726460 | `e828cfaf89a7b8f1b333b1d45daa03af5d7d8088bcf53a6efc3ee0788ca7f713` |
| strengthen-counseling.jpg | 11992194 | `05722cc91ef7d14cbb8a07a104ab82afb83bd148c1cda5ae90fb7a03d33fd63f` |
| ujat-left.jpg | 10229812 | `5d43fa1c8eaa06e3e639dbf1db4ee366bf29cca3f0d5dcddf53f13e73e3ff37e` |
| ujat-right.jpg | 4463258 | `7d5aadcef7ad4279a915b4b971b847ffa75254710697f1a28b199c071fe403dd` |
| employee.jpg | 9189520 | `69e13687b8d02845b2049606b2f63b7d4fb9186ea0479d5bb276667f5ff0f56f` |
| instructor-main.png | 1049951 | `fd431d91e7697e399e925d74c006162be5f6a1e4f131d410f3a04db65dfae5ff` |
| instructor-top.jpg | 2838955 | `65e75d7b48f697960b937e9ca7e4c861cbc3ca6db7866c4f87bf3d4f45e828c0` |
| instructor-bottom.png | 1512411 | `c421428aba72d257bc240e5bc1fcb8e2fca4bcd072a997563d70eb6c86f53f11` |
| startup-left.png | 994199 | `961f63135d67541d498ab8cb6db10b70a7995ae9fff1e5184df2ea524425946b` |
| startup-right.png | 364083 | `a0bb21476730ac870b824b33eeda420f7580c8b675724e5e0e74f3a7e79664d6` |
| contest.png | 1171511 | `61a9fcb3c5cfd4515fef192812513c6373d881e5ece7263d47b0e16b581f3d62` |
| elementary-main.png | 820392 | `0d3c11649197ff3e3d0da443c7a6fc8e645766ed46fb87488d7985e731b40cb4` |
| elementary-top.png | 257756 | `46d26517e12ae083ada9fa0d5e0763dfdc1c3967d7360494420ec31f6cc18255` |
| elementary-bottom.png | 231403 | `349bbeaa67a3b197096e3a6763cf3f569f489d28fd9481315dae7fbc7bbf1805` |
| ai-literacy-lecture.png | 1279772 | `321ca57864c043d03844d6e569ce4d887d7eb0ff8352ce5346c26c2c5367878a` |
| ai-literacy-speaker.png | 1066168 | `12958c97acec592bb912df67ef926e5c64e90889f217b5bb8346d1d4cb560d0c` |
| sw-ai-practice.png | 1143961 | `be0b11abea5ab2df1f497146d05293c6be018fe8aed2c0faceee7ad4ba35ba2a` |

경로 prefix: `apps/platform/src/features/education-{career|finance|entrepreneurship|digital-literacy}/image/illustration/`.

권장 px (저장 width/height):

| 섹션 순서 | 장수 | px |
|-----------|------|----|
| 1 (2장) | 2 | 960×540, 440×540 |
| 2 (1장) | 1 | 1440×540 |
| 3 (3장) | 3 | 880×540, 520×260, 520×260 |

디지털은 1·2만. JPG/PNG. `strengthen-counseling.jpg` 는 11992194 bytes로 15MB 미만이다. 리사이즈로 해시를 바꾸지 마라.

교재 썸네일: Platform mock에 커버 파일이 없다. 공용 READY 1장을 8건에 써도 된다. 프로그램 갤러리 파일은 쓰지 마라. 1×1 더미는 쓰지 마라.

---

## 1. 프로그램 소개

`heroText` 는 두 줄을 `\n` 으로 잇는다. 앞뒤 공백 없음.

### CAREER_EMPLOYMENT

```
청소년이 자신의 진로를 주도적으로 탐색하고,
성공적인 취업에 필요한 역량을 갖출 수 있도록 교육합니다.
```

| sortOrder | sectionKey | programType | representativeProgram | sponsorName | images |
|-----------|------------|-------------|----------------------|-------------|--------|
| 1 | explore | 진로 탐색 프로그램 | Global Career Discovery | SAP | explore-lecture.jpg, explore-workshop.jpg |
| 2 | experience | 직무 체험 프로그램 | BETTER GROUND High School | KRAFTON | experience.jpg |
| 3 | strengthen | 취업 역량 강화 프로그램 | Build Your Opportunities | Starbucks | strengthen-barista.jpg, strengthen-mentoring.jpg, strengthen-counseling.jpg |

**explore.typeDescription**

청소년이 다양한 직업의 세계를 폭넓게 살펴보면서 막연했던 진로의 선택지를 구체적으로 넓혀가는 프로그램입니다. 학생들은 프로그램에 참여하면서 자신이 무엇에 관심 있고 어떤 일이 맞는지 스스로 탐색하는 시간을 갖습니다. 또한 현직자와의 대화와 직무 체험을 통해 각 직업이 실제로 어떤 일을 하는지 생생하게 이해하게 됩니다. 이 과정을 통해 청소년은 주도적으로 진로를 결정하는 힘을 갖게 됩니다.

**explore.representativeDescription**

SAP의 임직원이 멘토로 참여해 고등학생이 진로를 주도적으로 설계할 수 있도록 지원합니다. 학생들은 IT·소프트웨어 분야 진로 탐색은 물론, JA Career Success 교재를 활용해 직장 생활에 필요한 의사소통 능력과 문제 해결 역량을 키울 수 있는 다양한 교육에 참여합니다. 또한 AI 도구를 활용해 자신의 강점을 파악하고 진로를 고민해보는 시간도 가집니다.

alts: `강연자가 무대에서 진로 교육을 진행하고 참여자들이 경청하는 모습` / `참여자들이 테이블에 모여 활동하는 모습`

**experience.typeDescription**

청소년이 관심 있는 산업과 직무를 교실 밖 현장에서 직접 경험해보는 프로그램입니다. 자산운용, 항공, 영화·콘텐츠, 게임 개발 등 다양한 분야의 기업과 함께 현직자 멘토링 및 견학 기회를 제공합니다. 학생들은 책으로만 접하던 직업 세계를 눈으로 보고 손으로 익히며, 현업 전문가와 나누는 대화를 통해 진로와 미래를 주도적으로 구체화합니다. 일부 프로그램에서는 학생이 직접 결과물을 기획 및 제작해보는 프로젝트를 진행해 실무자로서의 가능성을 확장할 수 있도록 돕습니다. 청소년은 프로그램을 통해 자신에게 맞는 길을 스스로 탐색하는 힘을 기릅니다.

**experience.representativeDescription**

게임 분야 진로를 희망하는 고등학생에게 현직자 멘토링과 전문적인 교육을 제공해, 실제 게임을 개발할 수 있도록 지원합니다. 기획, 프로그래밍, 아트 등의 역할을 나눠 프로젝트를 수행하고, 그 과정에서 게임 개발 직무를 체험합니다. 2025년부터는 글로벌로 확장돼 여러 나라의 게임 개발 꿈나무 청소년과 교류할 수 있는 기회도 제공하고 있습니다.

alt: `참여자들이 모니터와 기기를 활용해 직무를 체험하는 모습`

**strengthen.typeDescription**

성공적인 취업에 필요한 실무 역량을 강화하고, 실제 취업까지 연결될 수 있도록 지원하는 프로그램입니다. 특성화고등학교 학생을 비롯해 사회 진출을 앞둔 청소년과 청년에게 이력서 작성, 자기소개서 첨삭, 실전 모의 면접 등 취업을 위한 스킬과 함께 직장에서 갖춰야 할 태도와 소통 방식에 대해서도 교육합니다. 학생들은 현직자 앞에서 직접 면접을 경험하며 자신감을 키우고 부족한 점을 스스로 보완할 수 있게 됩니다.

**strengthen.representativeDescription**

스타벅스 바리스타 파트너가 멘토로 활동하며 학생들에게 취업 준비 및 사회생활 기술, 바리스타 교육 등을 제공합니다. 특성화고등학교 학생들에게는 교육 이수 후 채용 연계의 기회까지 제공해 지금까지 500여 명 이상이 스타벅스 바리스타로 취업했습니다. 이와 함께 취업 역량을 종합적으로 키울 수 있는 JOB 박람회를 개최해 청년 취업 활성화를 도모하고 있습니다.

alts: `커피 관련 직무 체험 교육을 진행하는 모습` / `멘토와 참여자가 마주 앉아 대화하는 모습` / `상담·교육 활동이 이루어지는 모습`

### ECONOMICS_FINANCE

```
청소년이 시장경제의 원리를 이해하고 경제 지식을 습득해
생활 속에서 합리적인 의사 결정을 할 수 있도록 돕습니다.
```

| sortOrder | sectionKey | programType | representativeProgram | sponsorName | images |
|-----------|------------|-------------|----------------------|-------------|--------|
| 1 | ujat | 대학생 경제교육봉사단 UJAT | *(빈 문자열)* | *(빈 문자열)* | ujat-left.jpg, ujat-right.jpg |
| 2 | employee | 임직원 참여형 경제·금융 교육 | 꿀잼 어린이 금융교육 | 메트라이프생명 사회공헌재단 | employee.jpg |
| 3 | instructor | 강사 파견 경제·금융 교육 | 1사1교 경제·금융교육 | *(빈 문자열)* | instructor-main.png, instructor-top.jpg, instructor-bottom.png |

**ujat.typeDescription**

2006년부터 20년 넘게 지속되어 온 JA의 대표 경제교육 프로그램입니다. 전국 주요 지역의 대학생 봉사단원이 초등학교 정규 수업 시간에 강사로 참여해 체계적인 JA의 교재를 바탕으로 어린이 눈높이에 맞춘 체험형 경제교육을 진행합니다. 소비, 저축, 투자, 직업 등 일상적인 주제를 놀이와 활동으로 풀어내 경제의 기초 개념을 자연스럽게 전달합니다. 특히 서울, 경기, 대전, 대구, 전북, 부산 등 전국 단위로 운영돼 지역 간 교육 격차 해소에도 기여하고 있습니다.

**ujat.representativeDescription** 빈 문자열.

alts: `교실에서 교육자가 학생들에게 경제교육을 진행하는 모습` / `학생이 경제교육 활동지를 사용하는 모습`

**employee.typeDescription**

기업 임직원이 교육자로 참여해 청소년과 교감하며 직접 경제·금융교육을 진행하는 프로그램입니다. 임직원은 각 분야의 전문가로서 자신이 가진 전문성과 경험을 나누며, 청소년에게는 시장경제에 대한 올바른 인식을 심어줍니다. 기업의 전문성과 JA의 교육이 만나 청소년에게 한층 깊이 있는 배움을 전합니다.

**employee.representativeDescription**

메트라이프생명 소속 보험재무설계사(FSR)가 지역 초등학생에게 직접 경제교육을 진행합니다. 교육 접근성이 상대적으로 낮은 지역을 중심으로 임직원이 직접 찾아가 경제 지식을 체계적으로 전합니다. 이와 함께 지역아동센터 아동을 위한 참여형 경제·금융교육인 ‘꿀잼 어린이 금융올림픽’과, 화폐에 대한 이해를 돕는 ‘어린이 금융·화폐교육’을 통해 어린이가 합리적인 경제 주체로 자라나도록 지원합니다.

alt: `교실에서 교육자가 학생들을 대상으로 금융교육을 진행하는 모습`

**instructor.typeDescription**

전국 초·중·고등학교에 전문 경제교육 강사단을 파견하는 JA Korea의 대표 경제교육 입니다. 학교 정규 수업과 연계해 청소년이 근로자, 소비자, 개인으로서 미래의 삶을 준비할 수 있는 힘을 길러 줍니다. JA의 검증된 교재와 커리큘럼, 참여를 유도하는 놀이와 보드게임 등을 통해 교육을 효과적으로 전달합니다. 생활에 도움이 되는 실질적인 경제 지식을 전함으로써 청소년이 일상에서 합리적인 의사 결정을 내리는 토대를 만듭니다.

**instructor.representativeDescription**

금융 분야 기업과 학교를 매칭하는 1사1교 경제·금융교육은 전문 강사가 학교에 직접 찾아가 교육함으로써 경제교육에 대한 접근성을 높이고, 많은 학생들이 시장경제에 대해 바르게 이해할 수 있도록 지원합니다. 특별히 JA가 가진 교육 콘텐츠를 적극적으로 활용해 교육 효과성을 극대화하고 있습니다.

alts: `강사가 활동 자료를 들고 경제 개념을 설명하는 모습` / `교실 전체가 보이는 경제·금융 수업 장면` / `학생들이 참여하는 경제·금융 수업 장면`

### ENTREPRENEURSHIP

```
청소년이 기업과 기업가의 사회적 역할 및 기능을 이해하고,
기업가정신의 핵심 역량을 갖출 수 있도록 맞춤형 체험 교육을 제공합니다.
```

| sortOrder | sectionKey | programType | representativeProgram | sponsorName | images |
|-----------|------------|-------------|----------------------|-------------|--------|
| 1 | startup | 실물 창업 프로그램 | Company of the Year | *(빈 문자열)* | startup-left.png, startup-right.png |
| 2 | contest | 비즈니스 경연대회 | International Trade Challenge | FedEx | contest.png |
| 3 | elementary | 초·중등 기업가정신 교육 | 기발한 초등 CEO 교실 | 한국경제인협회 | elementary-main.png, elementary-top.png, elementary-bottom.png |

**startup.typeDescription**

청소년이 창업의 전 과정을 직접 실현해보는 체험형 기업가정신 교육입니다. 교육에 참여하는 학생들은 아이디어 발상과 디자인씽킹을 시작으로 제품 기획, 제작, 홍보, 판매, 투자 설명회(IR)까지 실제 창업의 절차를 직접 경험합니다. 더불어 팀을 이뤄 프로젝트를 수행하며 창의력, 리더십, 협동심, 문제 해결 능력, 위기 관리 능력을 기릅니다.

**startup.representativeDescription**

창업을 통해 주변 문제에 대한 해결 방안을 모색해보는 JA의 대표 기업가정신 교육 프로그램입니다. 청소년들은 문제를 해결할 수 있는 실물 상품을 기획 및 제작하고 전문가 앞에서 비즈니스 모델을 발표하는 ‘투자 설명회’를 거치며 비즈니스 관점에서 세상을 바라보는 경험을 얻습니다. 더불어 창업 과정에서 따라오는 실패와 성공의 경험을 밑거름 삼아 한 사람의 기업가로 성장합니다. 최종적으로 국내대회에서 우수한 성과를 거둔 팀은 아시아·태평양 지역 청소년 기업가들이 참여하는 국제대회 ‘JA Asia Pacific Company of the Year Competition’ 진출하게 됩니다.

alts: `청소년들이 부스에서 사업 아이디어와 제품을 설명하는 모습` / `청소년들이 수상 보드와 꽃다발을 들고 있는 모습`

**contest.typeDescription**

비즈니스 전략을 수립 및 발표하는 과정을 통해 기업가정신을 함양합니다. 대회에 참여하는 청소년은 무역, 창업, 금융, 컨설팅 등 여러 분야의 전문가와 교류하며 비즈니스 역량을 키웁니다. 또한 사업 계획이나 비즈니스 대응 방안을 발표하는 팀 단위 프로젝트를 겪으며 기업가로 발돋움할 수 있는 기반을 마련합니다. 국내 대회에서 뛰어난 성과를 거둔 팀에게는 JA 글로벌 네트워크와 협력해 국제대회 진출 자격을 제공합니다.

**contest.representativeDescription**

고등학생이 실제 무역 사례를 분석하고 발표하는 과정을 겪으며 기업가로 성장할 수 있도록 돕는 국제무역창업대회입니다. 학생들은 FedEx 임직원이 멘토로 참여하는 교육 워크숍을 통해 해외 시장에 대한 이해와 분석 방법을 대해 배우고, 실제 글로벌 상황에 기반한 마켓과 사업 아이템을 바탕으로 시장 진입 전략을 세워 발표하게 됩니다. 국내대회에서 우승한 팀에게는 아시아·태평양 지역 각 국가별 우승 팀이 모여 경쟁하는 Asia Pacific Finals 진출 자격을 부여합니다.

alt: `참가자들이 청중과 심사위원 앞에서 발표하는 모습`

**elementary.typeDescription**

초·중학생의 눈높이에 맞춰 참여형 교육과 놀이를 결합한 체험형 기업가정신 교육을 운영합니다. 교육을 듣고 나면 가족, 직업, 기업, 경제의 기본 개념을 자연스럽게 이해할 수 있습니다. 학생들은 상품을 만들고 CEO가 되어보는 활동으로 기업가정신과 창의력을 함양하게 됩니다.

**elementary.representativeDescription**

가족과 마을을 중심으로 경제의 기초 개념을 익히고, 장난감을 활용해 제품 생산부터 판매까지 기업 운영의 전 과정을 경험해보는 기업가정신 교육입니다. 이를 통해 청소년은 기업가의 시각과 시장 경제의 원리를 배웁니다. 특히 전국 늘봄·돌봄학교에서 기발한 CEO 교실을 진행함으로써 기업가정신 교육의 접근성을 높이는 데 기여하고 있습니다.

alts: `교실에서 강사와 학생들이 수업에 참여하는 모습` / `학생들이 테이블에서 활동하는 모습` / `강사가 교실에서 설명하는 모습`

### DIGITAL_LITERACY

섹션 2개만.

```
과학 기술을 기반으로 지식과 정보를 습득하는 방법을 익히고,
디지털 플랫폼을 통해 문제를 해결할 수 있도록 지원합니다.
```

| sortOrder | sectionKey | programType | representativeProgram | sponsorName | images |
|-----------|------------|-------------|----------------------|-------------|--------|
| 1 | ai-literacy | AI 리터러시 교육 | Google AI Educator Series(GES) | Google for Education | ai-literacy-lecture.png, ai-literacy-speaker.png |
| 2 | sw-ai | SW·AI 역량강화 교육 | 삼성SW·AI아카데미(SSAFY) | SAMSUNG | sw-ai-practice.png |

**ai-literacy.typeDescription**

생성형 AI를 안전하고 효과적으로 활용할 수 있도록 지원하는 교육 프로그램입니다. AI 도구로 창의성과 생산성을 높이는 방법과 AI가 생성하는 거짓 정보를 가려내고 책임감 있게 사용하는 AI 윤리를 함께 다룹니다. 교사에게는 수업에 AI를 통합함으로써 교육의 효과성을 높일 수 있게 돕고, 학생에게는 수강·과제·진로 탐색 등 다양한 교육의 영역에서 AI를 활용할 수 있는 힘을 길러줍니다.

**ai-literacy.representativeDescription**

생성형 AI인 Gemini를 활용해 교사 업무 생산성을 높이고 학생에게 양질의 학습 경험을 제공하는 교사 AI 역량강화 프로그램입니다. 생성형 AI와 각종 AI 도구를 교육 현장에 통합해 활용할 수 있도록 지원하며, AI 윤리 교육으로 기술을 효과적이고 책임감 있게 사용하는 힘을 기릅니다.

alts: `참가자들이 테이블에 앉아 AI 관련 강의를 듣고 발표 화면을 보는 모습` / `연단에서 마이크를 들고 발표하는 강사의 모습`

**sw-ai.typeDescription**

청소년과 청년이 소프트웨어, AI 등 첨단 산업에서 활용되는 디지털 도구를 효과적으로 사용할 수 있도록 지원합니다. 디자인씽킹 기반 체험형 AI 교육으로 가상의 문제를 해결하거나 산업 현장에서 사용하는 방식으로 AI를 활용해보는 등 폭넓은 교육 프로그램을 운영합니다. 또한 단순히 기술적 역량을 기르는 데 그치지 않고 여러 산업 분야에서 SW·AI 기술을 활용할 수 있도록 다양한 기회를 제공합니다.

**sw-ai.representativeDescription**

1년 과정의 실무 중심 SW·AI 교육으로 청년들이 취업 시장에서 경쟁력을 갖출 수 있도록 지원합니다. AI 활용 영상 제작이나 3D 프린팅 등 AI를 활용한 창작 활동으로 창의력을 키우는 ‘AI 창의캠프‘, 교육 과정 수료를 앞둔 청년에게 창업이라는 또 다른 진로 영역을 탐색할 수 있도록 ‘AI 창업캠프’를 운영하고 있습니다.

alt: `실습 장비가 있는 공간에서 강사가 참가자들에게 자료를 들어 설명하는 모습`

---

## 2. 사업분야 · overview

`introText`:

```
JA Korea는 다양한 교육 콘텐츠로 청소년의 배움과 성장을 돕습니다.
```

| fieldCode | displayOrder | enabled | displayName | description |
|-----------|--------------|---------|-------------|-------------|
| CAREER_EMPLOYMENT | 1 | true | 진로·취업 | 진로 탐색부터 직업 세계 준비까지 미래를 설계하는 역량을 키웁니다. |
| ECONOMICS_FINANCE | 2 | true | 경제·금융 | 생활 속 경제 개념부터 개인 금융 관리까지 단계별 역량을 키웁니다. |
| ENTREPRENEURSHIP | 3 | true | 기업가 정신 | 아이디어를 실행으로 옮기는 도전 정신과 창엽 역량을 경험합니다. |
| DIGITAL_LITERACY | 4 | true | 디지털 리터러시 | 소프트웨어와 디지털 도구를 이해하고 활용하는 힘을 기릅니다. |

`창엽` 은 Platform 디렉터리 원문이다. `창의` 나 `창업` 으로 고치지 마라.  
`displayName` 의 중점(·)과 `기업가 정신` 띄어쓰기를 빼지 마라. 디렉터리 제목 `진로취업` 등은 프론트 상수다.  
`notice` 는 빈 문자열.

---

## 3. 교육 대상

| displayOrder | targetCode | targetName |
|--------------|------------|------------|
| 1 | PRESCHOOL | 유아, 유치원생 |
| 2 | ELEMENTARY | 초등학교 |
| 3 | MIDDLE_SCHOOL | 중학교 |
| 4 | HIGH_SCHOOL | 고등학교 |
| 5 | ADULT | 성인 |

색 hex가 이미 있으면 유지: `#F6E846`, `#A1BC2C`, `#46B17B`, `#0CBDCC`, `#6D84DF`.

---

## 4. 교재 8건

`unitIntroHtml` 은 단원마다:

```html
<h3>1단원 로비의 농장 여행</h3>
<p>…</p>
```

`unitCount` 가 OpenAPI 최소 1이면 안내 자료도 1. `sessionDescription` 은 `차시 없음`.

| textbookName | fieldCode | targetCode | educationEffect | unitCount | sessionDescription |
|--------------|-----------|------------|-----------------|-----------|-------------------|
| 우리들의 경제생활 | ECONOMICS_FINANCE | PRESCHOOL | 읽기, 쓰기 | 4 | 30분 수업기준 4차시 교육 |
| 우주여행 | CAREER_EMPLOYMENT | MIDDLE_SCHOOL | *(빈)* | 3 | 45분 수업기준 6차시 교육 |
| 경제 탐험대 | ECONOMICS_FINANCE | ELEMENTARY | *(빈)* | 5 | 40분 수업기준 5차시 교육 |
| 직업의 세계 | CAREER_EMPLOYMENT | HIGH_SCHOOL | *(빈)* | 4 | 50분 수업기준 8차시 교육 |
| 창업 씨앗 키우기 | ENTREPRENEURSHIP | HIGH_SCHOOL | *(빈)* | 6 | 50분 수업기준 12차시 교육 |
| 디지털 시민 되기 | DIGITAL_LITERACY | ELEMENTARY | *(빈)* | 4 | 40분 수업기준 4차시 교육 |
| 성인을 위한 금융 리터러시 | ECONOMICS_FINANCE | ADULT | *(빈)* | 5 | 60분 수업기준 5차시 교육 |
| 교육 콘텐츠 이용 안내 | ECONOMICS_FINANCE | *(없음)* | *(빈)* | 1 | 차시 없음 |

description:

- 우리들의 경제생활: `유아, 유치원생을 대상으로 경제교육을 하는 교재입니다. 동화를 통해 경제 개념을 쉽게 이해할 수 있도록 구성되어 있습니다.`
- 우주여행: `중학생을 대상으로 진로·미래 직업을 탐구하는 교재입니다. 우주 탐사를 소재로 진로 탐색과 협업 역량을 기릅니다.`
- 경제 탐험대: `초등학생을 위한 경제·금융 입문 교재입니다. 생활 속 경제 이야기를 통해 합리적 소비와 저축을 배웁니다.`
- 직업의 세계: `고등학생이 다양한 직업 세계를 탐색하고 자기 이해를 넓히는 진로 교재입니다.`
- 창업 씨앗 키우기: `청소년·청년의 기업가정신을 키우는 실습형 교재입니다.`
- 디지털 시민 되기: `초·중학생을 위한 디지털 리터러시 기초 교재입니다. 온라인 예절과 정보 비판 능력을 다룹니다.`
- 성인을 위한 금융 리터러시: `성인 학습자를 위한 실용 금융 교육 콘텐츠입니다.`
- 교육 콘텐츠 이용 안내: `교재 신청·활용 전 확인이 필요한 공통 안내사항입니다.`

단원 (있는 것만 HTML에 넣는다. unitCount와 개수가 달라도 unitCount는 표의 숫자를 유지):

- 우리들의 경제생활: 1 로비의 농장 여행 — 로비와 함께 농장에 놀러가서 여러 동물들을 만나고 농장에서 생산되는 여러 자원에 대해 알아봅니다. 농장에서 생산되는 여러 자원에 대해 알아봅니다. / 2 로비의 시장 여행 — 로비와 함께 시장에 놀러가서 여러 상인들을 만나고 시장에서 거래되는 여러 물건에 대해 알아봅니다. 시장에서 거래되는 여러 물건에 대해 알아봅니다. / 3 로비의 은행 여행 — 로비와 함께 은행에 놀러가서 여러 은행원들을 만나고 은행에서 하는 여러 일에 대해 알아봅니다. 은행에서 하는 여러 일에 대해 알아봅니다. / 4 로비의 기업 여행 — 로비와 함께 기업에 놀러가서 여러 직장인들을 만나고 기업에서 하는 여러 일에 대해 알아봅니다. 기업에서 하는 여러 일에 대해 알아봅니다.
- 우주여행: 1 우주로 떠나는 첫걸음 — 우주와 관련된 직업을 알아보고 나와의 연결점을 찾아봅니다. / 2 팀으로 해결하는 미션 — 모둠 활동을 통해 협업과 문제 해결 과정을 경험합니다. / 3 나의 미래 설계도 — 관심 분야를 바탕으로 진로 로드맵을 작성합니다.
- 경제 탐험대: 1 돈이 생기는 곳 — 소득과 일의 관계를 생활 사례로 이해합니다. / 2 사고 싶은 것과 필요한 것 — 욕구와 필요를 구분해 합리적 소비를 연습합니다.
- 직업의 세계: 1 나를 아는 시간 — 흥미·강점·가치를 점검하며 진로 방향을 탐색합니다. / 2 변화하는 직업 세계 — 미래 산업과 직업 변화를 사례로 살펴봅니다.
- 창업 씨앗 키우기: 1 문제 발견하기 — 일상 속 문제를 발견하고 아이디어로 연결합니다. / 2 고객을 만나다 — 간단한 인터뷰로 고객 니즈를 확인합니다.
- 디지털 시민 되기: 1 나와 디지털 세상 — 디지털 기기의 역할과 안전 사용법을 배웁니다. / 2 믿을 수 있는 정보 — 가짜 뉴스와 사실을 구분하는 기준을 연습합니다.
- 성인을 위한 금융 리터러시: 1 가계부에서 시작하는 재무관리 — 수입·지출 구조를 파악하고 목표를 세웁니다.
- 교육 콘텐츠 이용 안내: 1 이용 전 확인사항 — 교재 대여·반납 절차와 저작권 안내를 확인합니다.

모두 enabled=true.

---

## 검수

- `CAREER_EMPLOYMENT` sections 3, keys explore/experience/strengthen, 이미지 200 + 해시
- `DIGITAL_LITERACY` sections 2
- overview introText · fields 4 · targets 5 (`PRESCHOOL` … `ADULT`)
- textbooks 공개 8제목. 구 제목 없음
- 목록 item에 unitCount · sessionDescription
- 상세 unitIntroHtml 에 `로비의 농장 여행` 포함
- 시드 2회 후 행 수 동일

## 작업 후 회신

```text
- 변경 파일:
- TRUNCATE 사용 여부: (없어야 함)
- 자동 재시드 제거 여부:
- program-intros 4 / 디지털 섹션 2:
- catalog 4 / targets 5 / textbooks 공개 8:
- 이미지 publicUrl 샘플 1개 + sha256:
```
