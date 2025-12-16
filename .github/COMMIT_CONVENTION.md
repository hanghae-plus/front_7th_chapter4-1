# 커밋 컨벤션

> UI 컴포넌트 모듈화와 디자인 시스템 프로젝트 커밋 메시지 작성 규칙

## 기본 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type (필수)

| Type         | 설명                      | 예시                                               |
| ------------ | ------------------------- | -------------------------------------------------- |
| **feat**     | 새로운 기능 추가          | `feat(ui): Button 컴포넌트 shadcn/ui 적용`         |
| **fix**      | 버그 수정                 | `fix(components): Modal 닫기 버튼 오류 수정`       |
| **refactor** | 리팩토링 (기능 변경 없음) | `refactor(pages): 인라인 스타일을 Tailwind로 변경` |
| **style**    | 스타일링 변경 (디자인)    | `style(ui): Button variants 색상 조정`             |
| **test**     | 테스트 추가/수정          | `test(components): Table 컴포넌트 테스트 추가`     |
| **docs**     | 문서 수정                 | `docs: Before/After 비교 문서 추가`                |
| **chore**    | 빌드, 설정 변경           | `chore: TailwindCSS 의존성 설치`                   |
| **perf**     | 성능 개선                 | `perf(ui): 컴포넌트 렌더링 최적화`                 |
| **design**   | 디자인 시스템 구축        | `design: 디자인 토큰 정의`                         |

## Scope (선택)

| Scope             | 설명                                   |
| ----------------- | -------------------------------------- |
| **tailwind**      | TailwindCSS 설정 및 스타일             |
| **ui**            | shadcn/ui 컴포넌트                     |
| **components**    | 커스텀 컴포넌트 (atoms, molecules 등)  |
| **pages**         | 페이지 컴포넌트                        |
| **storybook**     | Storybook 설정 및 stories              |
| **design-system** | 디자인 시스템 전반                     |
| **tokens**        | 디자인 토큰                            |
| **legacy**        | 레거시 코드 분석/제거                  |
| **migration**     | Before → After 마이그레이션            |
| **deps**          | 의존성 관리                            |
| **config**        | 설정 파일 (vite, postcss, tsconfig 등) |

## Subject 규칙

- **50자 이내**
- **한글 사용** (권장)
- **명령형**: "구현", "수정", "추가" (O), "구현했음", "수정함" (X)
- **마침표 없음**

## Body (선택)

- 72자마다 줄바꿈
- "무엇을", "왜" 변경했는지 설명
- "어떻게"는 코드로 설명

## Footer (선택)

- **Breaking Changes**: `BREAKING CHANGE: 설명`
- **Issue 참조**: `Closes #123`, `Refs #456`
- **과제 단계**: `Phase: 2 - TailwindCSS 설정`

---

## 예시

### 기본 예시

```bash
# TailwindCSS 설정
chore(tailwind): TailwindCSS v4 의존성 설치 및 설정

# 컴포넌트 마이그레이션
feat(ui): Button 컴포넌트 shadcn/ui로 마이그레이션

# 스타일 개선
refactor(pages): ManagementPage 인라인 스타일 제거

# Storybook
feat(storybook): Button 컴포넌트 stories 추가

# 문서화
docs: TailwindCSS 설정 가이드 추가

# Phase 완료
chore: Phase 2 완료 - TailwindCSS 설정
```

### 상세 예시

```bash
feat(ui): CVA를 사용한 Button variants 구현

기존 조건문 기반 스타일링을 CVA로 리팩토링하여
타입 안전성과 가독성을 향상시켰습니다.

- variant: default, destructive, outline, secondary
- size: default, sm, lg
- defaultVariants 설정

Phase: 3 - CVA Variants
```

---

## Phase별 커밋 패턴

### Phase 1 (레거시 분석)

```bash
docs(legacy): 레거시 시스템 문제점 분석 문서 작성
feat(legacy): Before 폴더 레거시 컴포넌트 분석 완료
chore: Phase 1 완료 - 레거시 시스템 분석
```

### Phase 2 (TailwindCSS 설정)

```bash
chore(deps): TailwindCSS v4 및 관련 패키지 설치
chore(config): PostCSS 설정 추가
feat(tailwind): index.css에 Tailwind 초기화
chore: Phase 2 완료 - TailwindCSS 설정
```

### Phase 3 (shadcn/ui 적용)

```bash
chore(deps): shadcn/ui 초기화
feat(ui): Button 컴포넌트 shadcn/ui 적용
feat(ui): Input 컴포넌트 shadcn/ui 적용
feat(ui): Select 컴포넌트 shadcn/ui 적용
chore: Phase 3 완료 - shadcn/ui 컴포넌트 마이그레이션
```

### Phase 4 (CVA Variants)

```bash
feat(ui): CVA로 Button variants 구현
feat(ui): CVA로 Badge variants 구현
refactor(ui): 모든 컴포넌트 variants 통일
chore: Phase 4 완료 - CVA Variants 패턴 적용
```

### Phase 5 (페이지 마이그레이션)

```bash
refactor(pages): ManagementPage 인라인 스타일 제거
refactor(pages): ManagementPage shadcn/ui 컴포넌트 적용
feat(pages): ManagementPage Tailwind 클래스로 마이그레이션
chore: Phase 5 완료 - ManagementPage 마이그레이션
```

### Phase 6 (Storybook)

```bash
chore(storybook): Storybook 설치 및 설정
feat(storybook): Button stories 작성
feat(storybook): Input stories 작성
feat(storybook): 모든 UI 컴포넌트 stories 완성
chore: Phase 6 완료 - Storybook 문서화
```

### Phase 7 (문서화 및 마무리)

```bash
docs: README Before/After 비교 작성
docs: 개선사항 및 학습 내용 정리
feat(design-system): Dark mode 구현
chore: 프로젝트 완료
```

---

## 커밋 전 회고 작성 (필수)

### 규칙

모든 **Phase 완료 커밋 전**에 **반드시** 회고 파일을 먼저 작성합니다.

### 회고 파일 작성 방법

1. **위치**: `review/` 폴더
2. **파일명**: `phase-N-제목.md` (예: `phase-2-tailwind-설정.md`)
3. **내용**: 한글로 작성
4. **커밋하지 않음**: `.gitignore`에 포함됨

### 회고 내용

다음 중 하나 이상 작성:

- **고민한 내용**: "왜 이 방식을 선택했는가?"
- **해결한 문제**: "어떤 문제가 있었고, 어떻게 해결했는가?"
- **배운 점**: "이번 구현으로 무엇을 배웠는가?"
- **Before vs After**: "어떤 점이 개선되었는가?"
- **대안**: "다른 방법은 없었을까?"
- **참고 자료**: "어떤 문서를 참고했는가?"

### 회고 파일 예시

```markdown
# phase-2-tailwind-설정.md

## 고민한 내용

Q: TailwindCSS v4와 v3의 차이는?
A: v4는 CSS-First Configuration으로 @import "tailwindcss" 사용

Q: globals.css vs index.css?
A: Vite 프로젝트는 index.css가 컨벤션

Q: PostCSS 플러그인 순서는?
A: @tailwindcss/postcss를 autoprefixer보다 먼저 적용

## 해결한 문제

문제: npx tailwindcss init -p가 작동 안 함
원인: pnpm monorepo에서는 npx 대신 pnpm exec 사용
해결: pnpm dlx tailwindcss init -p로 해결

문제: Tailwind 클래스가 적용 안 됨
원인: PostCSS 설정에 @tailwindcss/postcss 플러그인 누락
해결: postcss.config.js에 플러그인 추가

## Before vs After

Before:

- 604줄의 하드코딩된 CSS 파일
- #007bff 같은 하드코딩 색상
- 일관성 없는 spacing

After:

- @import "tailwindcss" 한 줄
- 디자인 토큰 자동 적용
- bg-blue-600, px-4 같은 유틸리티 클래스

## 배운 점

- TailwindCSS v4는 Rust 기반 Oxide 엔진 사용
- CSS 파일에서 @theme으로 테마 정의 가능
- pnpm monorepo에서는 dlx 명령어 사용
- PostCSS 플러그인 순서가 중요함

## 참고 자료

- TailwindCSS v4 공식 문서
- pnpm workspace 문서
```

---

## 커밋 단위

### 원칙

- **하나의 커밋 = 하나의 논리적 변경**
- **의존성 설치는 별도 커밋**
- **설정 파일 변경은 별도 커밋**
- **각 컴포넌트 마이그레이션은 별도 커밋**
- **Phase 완료 시 반드시 커밋**
- **회고 파일을 먼저 작성한 후 커밋**

### 예시

```bash
# ✅ Good - 논리적으로 독립적
git commit -m "chore(deps): TailwindCSS 의존성 설치"
git commit -m "chore(config): PostCSS 설정 추가"
git commit -m "feat(tailwind): index.css 생성 및 Tailwind 초기화"

# ❌ Bad - 여러 작업을 한 커밋에
git commit -m "feat(tailwind): TailwindCSS 설치 및 설정 완료"
```

---

## 금지 사항

### 모호한 메시지

```bash
# ❌ Bad
git commit -m "스타일 수정"
git commit -m "버그 수정"
git commit -m "업데이트"
git commit -m "WIP"

# ✅ Good
git commit -m "style(ui): Button hover 색상 조정"
git commit -m "fix(components): Modal 닫기 버튼 이벤트 오류 수정"
```

### Scope 누락

```bash
# ❌ Bad
git commit -m "feat: Button 컴포넌트 추가"

# ✅ Good
git commit -m "feat(ui): Button 컴포넌트 shadcn/ui 적용"
```

### Type 없음

```bash
# ❌ Bad
git commit -m "Button 컴포넌트 추가"

# ✅ Good
git commit -m "feat(ui): Button 컴포넌트 추가"
```

### AI 언급 금지

```bash
# ❌ Bad - AI 도움 명시
git commit -m "feat(ui): Button 구현 (Claude 도움)"
git commit -m "fix: Cursor AI로 버그 해결"
git commit -m "refactor: AI 사용해서 코드 개선"

# ✅ Good - 구현 내용만
git commit -m "feat(ui): Button 컴포넌트 CVA로 구현"
git commit -m "fix(components): Modal 상태 관리 오류 수정"
git commit -m "refactor(pages): 인라인 스타일을 Tailwind로 마이그레이션"
```

**이유**: 커밋 히스토리는 **무엇을 했는지**만 기록. AI 도움 여부는 중요하지 않음.

---

## 특별 커밋 패턴

### 의존성 설치

```bash
chore(deps): TailwindCSS 관련 패키지 설치
chore(deps): CVA, clsx, tailwind-merge 설치
chore(deps): shadcn/ui 초기화
chore(deps): Storybook 설치
```

### 설정 파일

```bash
chore(config): PostCSS 설정 추가
chore(config): TailwindCSS config 생성
chore(config): Storybook 설정
chore(config): tsconfig paths 설정
```

### 레거시 제거

```bash
refactor(legacy): 레거시 CSS 파일 제거
refactor(legacy): 인라인 스타일 제거
refactor(components): Atomic Design 폴더 구조 평탄화
```

### Dark Mode

```bash
feat(design-system): Dark mode 테마 변수 정의
feat(ui): Dark mode 지원 컴포넌트 업데이트
feat(design-system): Dark mode toggle 구현
```

---

## 도구

### .gitignore 확인

```bash
# review/ 폴더가 ignore 되어 있는지 확인
review/
```

### 커밋 템플릿 (선택)

```bash
# .gitmessage
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>
# Phase: N - 단계명

git config commit.template .gitmessage
```

---

## 참고

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)
- TailwindCSS 공식 문서
- shadcn/ui 공식 문서
