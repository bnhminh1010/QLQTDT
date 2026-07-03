# CI Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng cấp CI để chặn dependency có CVE, giảm quyền GitHub token, chạy test bắt buộc, scan secret an toàn hơn, và bao phủ cả backend lẫn frontend.

**Architecture:** Tách CI thành các gate rõ ràng: backend build/test/lint, NuGet vulnerability gate, security scan, frontend build/audit. Workflow dùng least-privilege permissions, action pin theo SHA, checkout không giữ credential, và các scan quan trọng phải fail build khi phát hiện lỗi high/critical.

**Tech Stack:** GitHub Actions, ASP.NET Core .NET 10, EF Core, xUnit, NuGet audit, CodeQL, Trivy, Gitleaks, SonarQube, React/Vite/npm.

---

## Findings

- **High - CI không chặn CVE hiện có:** `QLQTDT/.github/workflows/ci-backend.yml:72-81` chạy Trivy với `exit-code: '0'`, nên high/critical vulnerability chỉ upload SARIF nhưng không fail build. Audit hiện tại xác nhận `Microsoft.OpenApi 2.4.1` có high severity advisory `GHSA-v5pm-xwqc-g5wc`.
- **High - Backend tests không chạy trong CI:** workflow chỉ restore/build/format ở `ci-backend.yml:30-37`, không chạy `dotnet test Tests/QLQTDT.Api.Tests.csproj`. Các guard bảo mật mới có thể bị phá mà CI vẫn xanh.
- **Medium - GitHub token chưa least privilege toàn workflow:** chỉ job `security-scan` có permissions ở `ci-backend.yml:43-45`; job build đang phụ thuộc default repository permissions. GitHub docs khuyến nghị đặt `permissions` tối thiểu ở workflow/job.
- **Medium - Secret scanner được cài bằng curl pipe không kiểm checksum:** `ci-backend.yml:88-92` tải binary từ internet rồi move vào `/usr/local/bin` mà không xác minh SHA256. Nếu release asset hoặc network path bị can thiệp, runner sẽ chạy binary không được kiểm chứng.
- **Medium - Gitleaks log có thể lộ secret:** `ci-backend.yml:95` chưa dùng `--redact`, nên nếu phát hiện secret thật thì output CI có nguy cơ in ra giá trị nhạy cảm.
- **Medium - CodeQL đang ở buildless mode:** `ci-backend.yml:60-70` dùng `build-mode: none`; cách này hữu ích khi workaround .NET 10, nhưng độ bao phủ C# thấp hơn manual build. Cần giữ tạm thời hoặc chuyển sang manual build khi verified với .NET 10 runner.
- **Medium - Trigger paths thiếu vùng thay đổi quan trọng:** `ci-backend.yml:3-9` không chạy khi chỉ đổi `Tests/**`, `docker-compose.backend.yml`, lock files, hoặc frontend. Test/security CI có thể bị bypass bởi PR chỉ sửa test hoặc CI/CD side files.
- **Medium - NuGet restore chưa deterministic:** repo chưa có `packages.lock.json`, workflow restore bình thường ở `ci-backend.yml:30-31` và `57-58`. Dependency graph có thể drift theo thời gian.
- **Medium - Project file có publish secret risk:** `QLQTDT/backend/QLQTDT.Api.csproj:29-31` copy `../.env` vào output/publish nếu file tồn tại. Nếu deploy job tạo `.env`, artifact có thể chứa DB/JWT secrets.
- **Low - Test project có ProjectReference lỗi:** `QLQTDT/Tests/QLQTDT.Api.Tests.csproj:23` reference `..\QLQTDT.Api.csproj` không tồn tại. Build hiện chỉ warning, nhưng CI strict hơn có thể fail nhiễu.
- **Low - Chưa có Dependabot config:** không có `.github/dependabot.yml`, nên pinned actions, NuGet, npm, và Docker base image không có update PR tự động.

## Reference Notes

- GitHub Actions docs cho phép đặt `permissions: {}` hoặc granular permissions; unspecified permissions trong job được set về `none`.
- Upload SARIF cần `security-events: write`; các job build/test thông thường chỉ cần `contents: read`.
- Dependency review/action scanning nên chạy trên PR để ngăn dependency dễ tổn thương được thêm vào.

---

### Task 1: Fix Vulnerable Dependency, Test Project Reference, And NuGet Lock Files

**Files:**
- Modify: `QLQTDT/backend/QLQTDT.Api.csproj`
- Modify: `QLQTDT/Tests/QLQTDT.Api.Tests.csproj`
- Create: `QLQTDT/backend/packages.lock.json`
- Create: `QLQTDT/Tests/packages.lock.json`

- [ ] **Step 1: Update backend OpenAPI-related packages**

In `QLQTDT/backend/QLQTDT.Api.csproj`, change the affected package lines to:

```xml
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.9" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="10.2.3" />
```

- [ ] **Step 2: Remove stale test project reference**

In `QLQTDT/Tests/QLQTDT.Api.Tests.csproj`, replace the project reference block with:

```xml
<ItemGroup>
  <ProjectReference Include="..\backend\QLQTDT.Api.csproj" />
</ItemGroup>
```

- [ ] **Step 3: Generate NuGet lock files**

Run:

```bash
dotnet restore backend/QLQTDT.Api.csproj --use-lock-file
dotnet restore Tests/QLQTDT.Api.Tests.csproj --use-lock-file
```

Expected:

```text
Restore succeeded.
```

- [ ] **Step 4: Verify no vulnerable NuGet packages remain**

Run:

```bash
dotnet list backend/QLQTDT.Api.csproj package --vulnerable --include-transitive
dotnet list Tests/QLQTDT.Api.Tests.csproj package --vulnerable --include-transitive
```

Expected:

```text
has no vulnerable packages
```

- [ ] **Step 5: Commit dependency baseline**

Run:

```bash
git add backend/QLQTDT.Api.csproj Tests/QLQTDT.Api.Tests.csproj backend/packages.lock.json Tests/packages.lock.json
git commit -m "fix(ci): lock backend dependencies"
```

---

### Task 2: Harden Backend CI Workflow

**Files:**
- Modify: `QLQTDT/.github/workflows/ci-backend.yml`

- [ ] **Step 1: Replace backend workflow with least-privilege gated CI**

Replace `QLQTDT/.github/workflows/ci-backend.yml` with:

```yaml
name: CI - Backend

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
      - 'Tests/**'
      - '.github/workflows/ci-backend.yml'
      - 'docker-compose.backend.yml'
      - 'Directory.Build.props'
      - 'Directory.Packages.props'
      - 'global.json'
  pull_request:
    branches: [main, develop]
    paths:
      - 'backend/**'
      - 'Tests/**'
      - '.github/workflows/ci-backend.yml'
      - 'docker-compose.backend.yml'
      - 'Directory.Build.props'
      - 'Directory.Packages.props'
      - 'global.json'

permissions:
  contents: read

env:
  DOTNET_VERSION: '10.0.x'
  PROJECT_PATH: 'backend/QLQTDT.Api.csproj'
  TEST_PROJECT_PATH: 'Tests/QLQTDT.Api.Tests.csproj'

jobs:
  build-test-lint:
    name: Build, Test & Lint
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout code
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          persist-credentials: false

      - name: Setup .NET SDK
        uses: actions/setup-dotnet@67a3573c9a986a3f9c594539f4ab511d57bb3ce9 # v4.3.1
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}
          cache: true
          cache-dependency-path: |
            backend/**/*.csproj
            Tests/**/*.csproj
            **/packages.lock.json

      - name: Restore backend dependencies
        run: dotnet restore "${{ env.PROJECT_PATH }}" --locked-mode

      - name: Restore test dependencies
        run: dotnet restore "${{ env.TEST_PROJECT_PATH }}" --locked-mode

      - name: Build tests and backend
        run: dotnet build "${{ env.TEST_PROJECT_PATH }}" --no-restore --configuration Release --no-incremental

      - name: Run backend tests
        run: dotnet test "${{ env.TEST_PROJECT_PATH }}" --no-build --configuration Release --logger "trx;LogFileName=backend-tests.trx"

      - name: Check backend formatting
        run: dotnet format "${{ env.PROJECT_PATH }}" --verify-no-changes --no-restore

      - name: Check test formatting
        run: dotnet format "${{ env.TEST_PROJECT_PATH }}" --verify-no-changes --no-restore

  nuget-vulnerability-gate:
    name: NuGet Vulnerability Gate
    needs: build-test-lint
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout code
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          persist-credentials: false

      - name: Setup .NET SDK
        uses: actions/setup-dotnet@67a3573c9a986a3f9c594539f4ab511d57bb3ce9 # v4.3.1
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Restore locked dependencies
        run: |
          dotnet restore "${{ env.PROJECT_PATH }}" --locked-mode
          dotnet restore "${{ env.TEST_PROJECT_PATH }}" --locked-mode

      - name: Fail on vulnerable NuGet packages
        run: |
          dotnet list "${{ env.PROJECT_PATH }}" package --vulnerable --include-transitive --format json > backend-nuget-vulnerabilities.json
          dotnet list "${{ env.TEST_PROJECT_PATH }}" package --vulnerable --include-transitive --format json > tests-nuget-vulnerabilities.json
          for file in backend-nuget-vulnerabilities.json tests-nuget-vulnerabilities.json; do
            jq -e '[.projects[].frameworks[] | (.topLevelPackages // []), (.transitivePackages // []) | .[] | select((.vulnerabilities // []) | length > 0)] | length == 0' "$file"
          done

  security-scan:
    name: Security Scan
    needs: build-test-lint
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - name: Checkout code
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup .NET SDK
        uses: actions/setup-dotnet@67a3573c9a986a3f9c594539f4ab511d57bb3ce9 # v4.3.1
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Restore dependencies
        run: dotnet restore "${{ env.PROJECT_PATH }}" --locked-mode

      - name: Initialize CodeQL
        uses: github/codeql-action/init@4d6150cc15f4cf6b68f0c4cff5ec0f020ad4bf5b # v3.28.14
        with:
          languages: csharp
          build-mode: none

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@4d6150cc15f4cf6b68f0c4cff5ec0f020ad4bf5b # v3.28.14
        with:
          category: '/language:csharp'

      - name: Trivy dependency scan SARIF
        uses: aquasecurity/trivy-action@a9c7b0f06e461e9d4b4d1711f154ee024b8d7ab8 # v0.36.0
        with:
          scan-type: 'fs'
          scan-ref: 'backend/'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '0'

      - name: Upload Trivy results
        if: ${{ always() && hashFiles('trivy-results.sarif') != '' }}
        uses: github/codeql-action/upload-sarif@4d6150cc15f4cf6b68f0c4cff5ec0f020ad4bf5b # v3.28.14
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Trivy dependency gate
        uses: aquasecurity/trivy-action@a9c7b0f06e461e9d4b4d1711f154ee024b8d7ab8 # v0.36.0
        with:
          scan-type: 'fs'
          scan-ref: 'backend/'
          format: 'table'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
          ignore-unfixed: true

      - name: Install gitleaks with checksum verification
        run: |
          curl -sSfL -o gitleaks_8.21.2_linux_x64.tar.gz "https://github.com/gitleaks/gitleaks/releases/download/v8.21.2/gitleaks_8.21.2_linux_x64.tar.gz"
          echo "5bc41815076e6ed6ef8fbecc9d9b75bcae31f39029ceb55da08086315316e3ba  gitleaks_8.21.2_linux_x64.tar.gz" | sha256sum -c -
          tar xzf gitleaks_8.21.2_linux_x64.tar.gz gitleaks
          sudo install -m 0755 gitleaks /usr/local/bin/gitleaks

      - name: Gitleaks secret scan
        run: gitleaks detect --source . --no-banner --redact --exit-code 1

      - name: SonarQube scan
        if: ${{ github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository }}
        uses: SonarSource/sonarqube-scan-action@bfd4e558cda28cda6b5defafb9232d191be8c203 # v4.2.1
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

- [ ] **Step 2: Validate workflow syntax locally**

Run:

```bash
yamllint .github/workflows/ci-backend.yml
```

If `yamllint` is not installed, run:

```bash
npm exec --yes yaml-lint .github/workflows/ci-backend.yml
```

Expected:

```text
No YAML syntax errors.
```

- [ ] **Step 3: Commit backend CI hardening**

Run:

```bash
git add .github/workflows/ci-backend.yml
git commit -m "ci: harden backend security gates"
```

---

### Task 3: Stop Publishing Local .env Secrets

**Files:**
- Modify: `QLQTDT/backend/QLQTDT.Api.csproj`

- [ ] **Step 1: Remove publish-time .env copy**

Delete this block from `QLQTDT/backend/QLQTDT.Api.csproj`:

```xml
<ItemGroup Condition="Exists('../.env')">
  <None Include="../.env" Link=".env" CopyToOutputDirectory="PreserveNewest" CopyToPublishDirectory="PreserveNewest" />
</ItemGroup>
```

- [ ] **Step 2: Verify publish output does not contain `.env`**

Run:

```bash
dotnet publish backend/QLQTDT.Api.csproj -c Release -o /tmp/qtdt-ci-security-publish
find /tmp/qtdt-ci-security-publish -maxdepth 1 -name '.env' -print
```

Expected:

```text
```

- [ ] **Step 3: Commit publish secret hardening**

Run:

```bash
git add backend/QLQTDT.Api.csproj
git commit -m "fix(security): exclude env file from publish"
```

---

### Task 4: Add Frontend CI Coverage

**Files:**
- Create: `QLQTDT/.github/workflows/ci-frontend.yml`

- [ ] **Step 1: Create frontend build and audit workflow**

Create `QLQTDT/.github/workflows/ci-frontend.yml` with:

```yaml
name: CI - Frontend

on:
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'
      - '.github/workflows/ci-frontend.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'frontend/**'
      - '.github/workflows/ci-frontend.yml'

permissions:
  contents: read

jobs:
  build-and-audit:
    name: Frontend Build & Audit
    runs-on: ubuntu-latest
    permissions:
      contents: read
    defaults:
      run:
        working-directory: frontend
    steps:
      - name: Checkout code
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Audit production dependencies
        run: npm audit --omit=dev --audit-level=high

      - name: Audit all dependencies
        run: npm audit --audit-level=high

      - name: Build frontend
        run: npm run build
```

- [ ] **Step 2: Verify frontend CI commands locally**

Run:

```bash
cd frontend
npm ci
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
npm run build
```

Expected:

```text
found 0 vulnerabilities
built in
```

- [ ] **Step 3: Commit frontend CI**

Run:

```bash
git add .github/workflows/ci-frontend.yml
git commit -m "ci: add frontend security gate"
```

---

### Task 5: Add Automated Dependency Update PRs

**Files:**
- Create: `QLQTDT/.github/dependabot.yml`

- [ ] **Step 1: Add Dependabot config**

Create `QLQTDT/.github/dependabot.yml` with:

```yaml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    target-branch: "develop"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "08:00"
      timezone: "Asia/Ho_Chi_Minh"

  - package-ecosystem: "nuget"
    directory: "/backend"
    target-branch: "develop"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "08:15"
      timezone: "Asia/Ho_Chi_Minh"

  - package-ecosystem: "nuget"
    directory: "/Tests"
    target-branch: "develop"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "08:30"
      timezone: "Asia/Ho_Chi_Minh"

  - package-ecosystem: "npm"
    directory: "/frontend"
    target-branch: "develop"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "08:45"
      timezone: "Asia/Ho_Chi_Minh"

  - package-ecosystem: "docker"
    directory: "/backend"
    target-branch: "develop"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "Asia/Ho_Chi_Minh"
```

- [ ] **Step 2: Commit Dependabot config**

Run:

```bash
git add .github/dependabot.yml
git commit -m "ci: enable dependency update checks"
```

---

### Task 6: Final Verification And Repository Settings

**Files:**
- Verify: `QLQTDT/.github/workflows/ci-backend.yml`
- Verify: `QLQTDT/.github/workflows/ci-frontend.yml`
- Verify: `QLQTDT/.github/dependabot.yml`

- [ ] **Step 1: Run local backend verification**

Run:

```bash
dotnet restore backend/QLQTDT.Api.csproj --locked-mode
dotnet restore Tests/QLQTDT.Api.Tests.csproj --locked-mode
dotnet build Tests/QLQTDT.Api.Tests.csproj --no-restore --configuration Release --no-incremental
dotnet test Tests/QLQTDT.Api.Tests.csproj --no-build --configuration Release
dotnet format backend/QLQTDT.Api.csproj --verify-no-changes --no-restore
dotnet format Tests/QLQTDT.Api.Tests.csproj --verify-no-changes --no-restore
```

Expected:

```text
Build succeeded.
Passed!
```

- [ ] **Step 2: Run local security verification**

Run:

```bash
dotnet list backend/QLQTDT.Api.csproj package --vulnerable --include-transitive --format json > backend-nuget-vulnerabilities.json
dotnet list Tests/QLQTDT.Api.Tests.csproj package --vulnerable --include-transitive --format json > tests-nuget-vulnerabilities.json
jq -e '[.projects[].frameworks[] | (.topLevelPackages // []), (.transitivePackages // []) | .[] | select((.vulnerabilities // []) | length > 0)] | length == 0' backend-nuget-vulnerabilities.json
jq -e '[.projects[].frameworks[] | (.topLevelPackages // []), (.transitivePackages // []) | .[] | select((.vulnerabilities // []) | length > 0)] | length == 0' tests-nuget-vulnerabilities.json
```

Expected:

```text
true
true
```

- [ ] **Step 3: Run local frontend verification**

Run:

```bash
cd frontend
npm ci
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
npm run build
```

Expected:

```text
found 0 vulnerabilities
built in
```

- [ ] **Step 4: Configure GitHub branch protection**

In GitHub repository settings, require these checks before merging into `develop` and `main`:

```text
Build, Test & Lint
NuGet Vulnerability Gate
Security Scan
Frontend Build & Audit
```

Also enable:

```text
Require branches to be up to date before merging
Require review from code owners or at least 1 reviewer
Dismiss stale pull request approvals when new commits are pushed
Do not allow bypassing the above settings
```

- [ ] **Step 5: Commit final verification cleanup**

Run:

```bash
rm -f backend-nuget-vulnerabilities.json tests-nuget-vulnerabilities.json
git status --short
```

Expected:

```text
```

## Self-Review

- Spec coverage: plan covers current CI vulnerabilities, backend dependency vulnerability, missing backend tests, secret scan safety, frontend CI gap, `.env` publish risk, and dependency update automation.
- Completeness scan: all action SHAs and Gitleaks checksum are concrete.
- Type/path consistency: all paths are rooted under `QLQTDT/` in the Files sections and use repository-relative paths inside commands after `cd QLQTDT`.
