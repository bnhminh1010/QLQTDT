# ***QUY ĐỊNH & HƯỚNG DẪN DÀNH CHO DEV TEAM***

## ***1\. GIT FLOW & VERSION CONTROL***

### ***1.1. Branching Strategy***

***Các nhánh chính:***

* *`main/master`: Nhánh production, luôn ở trạng thái stable*  
* *`develop`: Nhánh phát triển chính, tích hợp các tính năng mới*  
* *`staging`: Nhánh dùng để test trước khi merge vào main (nếu có)*

***Các nhánh phụ:***

* *`feature/*`: Phát triển tính năng mới*  
  * *Format: `feature/task-id-short-description`*  
  * *Ví dụ: `feature/TASK-123-user-authentication`*  
* *`bugfix/*`: Sửa bug trên nhánh develop*  
  * *Format: `bugfix/task-id-short-description`*  
  * *Ví dụ: `bugfix/BUG-456-fix-login-error`*  
* *`hotfix/*`: Sửa bug khẩn cấp trên production*  
  * *Format: `hotfix/task-id-short-description`*  
  * *Ví dụ: `hotfix/HOTFIX-789-critical-payment-issue`*  
* *`release/*`: Chuẩn bị release version mới*  
  * *Format: `release/v1.2.0`*

***Quy trình làm việc:***

1. *Tạo nhánh mới từ `develop` (hoặc `main` nếu là hotfix)*  
2. *Commit code theo convention*  
3. *Push lên remote và tạo Pull Request*  
4. *Sau khi merge, xóa nhánh feature/bugfix*

### ***1.2. Commit Convention***

***Format chuẩn:***

*\<type\>(\<scope\>): \<subject\>*

*\<body\>*

*\<footer\>*

***Giải thích từng phần:***

1. ***`<type>`** \- Loại thay đổi (bắt buộc)*  
2. ***`(<scope>)`** \- Phạm vi thay đổi (tùy chọn)*  
3. ***`<subject>`** \- Mô tả ngắn gọn (bắt buộc)*  
4. ***`<body>`** \- Mô tả chi tiết (tùy chọn)*  
5. ***`<footer>`** \- Metadata như task ID, breaking changes (tùy chọn)*

---

***Các loại type:***

* *`feat`: Tính năng mới*  
* *`fix`: Sửa bug*  
* *`docs`: Thay đổi documentation*  
* *`style`: Format code (không ảnh hưởng logic)*  
* *`refactor`: Refactor code*  
* *`perf`: Cải thiện performance*  
* *`test`: Thêm/sửa test*  
* *`chore`: Cập nhật build, dependencies*  
* *`revert`: Revert commit trước đó*

***Scope thường dùng:***

* *`auth`: Authentication/Authorization*  
* *`api`: API endpoints*  
* *`ui`: User interface*  
* *`db`: Database*  
* *`config`: Configuration*  
* *`deps`: Dependencies*

---

***VÍ DỤ CHI TIẾT:***

***1\. Commit đơn giản (chỉ có type \+ subject):***

*feat: thêm chức năng đăng nhập*

*fix: sửa lỗi hiển thị avatar*

*docs: cập nhật README*

***2\. Commit có scope:***

*feat(auth): thêm chức năng đăng nhập bằng Google*

*fix(payment): sửa lỗi tính toán VAT*

*style(header): căn chỉnh logo*

***3\. Commit đầy đủ (có body):***

*feat(auth): thêm chức năng đăng nhập bằng Google*

*\- Tích hợp Google OAuth2*

*\- Thêm button đăng nhập Google trên UI*

*\- Xử lý callback và lưu token*

*\- Tự động tạo user nếu chưa tồn tại*

***4\. Commit có task reference:***

*feat(payment): tích hợp cổng thanh toán VNPay*

*Thêm integration với VNPay payment gateway*

*để hỗ trợ thanh toán qua QR code và thẻ ATM*

*Refs: \#123*

***5\. Commit fix bug:***

*fix(cart): sửa lỗi tính tổng tiền khi có mã giảm giá*

*Trước đây logic tính toán bị sai khi áp dụng*

*discount code, dẫn đến tổng tiền âm trong một số case*

*Fixes: \#456*

***6\. Commit có breaking change:***

*feat(api): thay đổi format response của API user*

*Đổi format response từ snake\_case sang camelCase*

*để consistent với convention của frontend*

*BREAKING CHANGE: API response format đã thay đổi*

*\- first\_name \-\> firstName*

*\- last\_name \-\> lastName*

*Client cần update code để compatible*

*Refs: \#789*

***7\. Commit refactor:***

*refactor(utils): tối ưu hàm formatDate*

*Sử dụng date-fns thay vì moment.js để giảm bundle size*

*Performance cải thiện \~20%*

***8\. Commit test:***

*test(auth): thêm test cases cho login flow*

*\- Test successful login*

*\- Test failed login with wrong password*

*\- Test account lockout after 5 failed attempts*

***9\. Commit performance:***

*perf(api): optimize database queries*

*\- Add index cho email column*

*\- Sử dụng batch query thay vì N+1*

*\- Giảm query time từ 500ms xuống 50ms*

***10\. Commit chore:***

*chore(deps): update dependencies*

*\- React 18.2.0 \-\> 18.3.0*

*\- TypeScript 5.1 \-\> 5.2*

*\- Fix các deprecation warnings*

***11\. Commit revert:***

*revert: revert "feat(payment): tích hợp VNPay"*

*This reverts commit abc123def456*

*Lý do: VNPay API đang có issues, rollback về version cũ*

***12\. Commit với nhiều file/module:***

*feat(user): thêm trang profile và settings*

*\- Tạo component UserProfile*

*\- Tạo component UserSettings*

*\- Thêm API endpoints /api/user/profile, /api/user/settings*

*\- Implement form validation*

*Refs: \#234, \#235*

---

***QUY TẮC VIẾT:***

*✅ **NÊN:***

* *Subject viết thường, không viết hoa chữ đầu*  
* *Subject không có dấu chấm ở cuối*  
* *Subject dùng động từ ở thì hiện tại: "add" không phải "added"*  
* *Subject tối đa 50-72 ký tự*  
* *Body giải thích "what" và "why", không phải "how"*  
* *Body mỗi dòng tối đa 72 ký tự*  
* *Có dòng trống giữa subject và body*

*❌ **KHÔNG NÊN:***

*Fix bug                        // Quá chung chung*

*Fixed login bug.               // Sai thì, có dấu chấm*

*feat: Add new feature          // Viết hoa*

*update code                    // Thiếu type*

*✅ **TỐT:***

*fix(auth): sửa lỗi logout không xóa session*

*feat(cart): thêm tính năng lưu giỏ hàng*

*perf(api): tối ưu query lấy danh sách sản phẩm*

***Quy tắc:***

* *Subject: Tối đa 50 ký tự, viết thường, không dấu chấm cuối*  
* *Body: Mô tả chi tiết (nếu cần), mỗi dòng tối đa 72 ký tự*  
* *Footer: Tham chiếu task ID, breaking changes*  
* *Commit thường xuyên, mỗi commit làm 1 việc cụ thể*  
* *Không commit code đang lỗi hoặc chưa test*

### ***1.3. Pull/Merge Request Process***

***Trước khi tạo PR:***

* *\[ \] Code đã được test kỹ trên local*  
* *\[ \] Đã update từ nhánh base (develop/main) mới nhất*  
* *\[ \] Resolve hết conflicts (nếu có)*  
* *\[ \] Chạy linter và format code*  
* *\[ \] Viết/update test cases*  
* *\[ \] Update documentation liên quan*

***Tạo Pull Request:***

* *Tiêu đề rõ ràng, có task ID: `[TASK-123] Thêm chức năng thanh toán`*  
* *Mô tả chi tiết:*  
  * *Mục đích của PR*  
  * *Các thay đổi chính*  
  * *Hướng dẫn test (nếu cần)*  
  * *Screenshots/Videos (nếu là UI)*  
  * *Breaking changes (nếu có)*  
* *Gán reviewer (tối thiểu 1-2 người)*  
* *Gắn labels phù hợp*  
* *Link task/issue tương ứng*

***Template PR:***

*\#\# Mô tả*

*Mô tả ngắn gọn về thay đổi*

*\#\# Loại thay đổi*

*\- \[ \] Bug fix*

*\- \[ \] New feature*

*\- \[ \] Breaking change*

*\- \[ \] Documentation update*

*\#\# Checklist*

*\- \[ \] Code đã được test*

*\- \[ \] Đã viết/update test cases*

*\- \[ \] Đã update documentation*

*\- \[ \] Code tuân thủ convention*

*\- \[ \] Không có warning/error*

*\#\# Screenshots (nếu có)*

*\#\# Cách test*

*Hướng dẫn reviewer cách test thay đổi này*

***Quy tắc merge:***

* *Cần ít nhất 1 approval từ reviewer*  
* *Tất cả comments phải được resolve*  
* *CI/CD pipeline phải pass*  
* *Không merge PR của chính mình (trừ trường hợp đặc biệt)*  
* *Sử dụng "Squash and merge" cho feature branches*  
* *Sử dụng "Rebase and merge" cho hotfix*

### ***1.4. Conflict Resolution***

***Khi gặp conflict:***

1. *Pull code mới nhất từ nhánh base*  
2. *Resolve conflict cẩn thận, không xóa code của người khác*  
3. *Test lại sau khi resolve*  
4. *Commit với message rõ ràng: `chore: resolve conflicts with develop`*  
5. *Nếu không chắc chắn, hỏi người viết code gốc*

***Best practices:***

* *Rebase thường xuyên với nhánh develop*  
* *Chia nhỏ PR để tránh conflicts lớn*  
* *Communicate với team về những phần code đang làm*

---

## 

## ***2\. CODE CONVENTION & STANDARDS***

### ***2.1. Naming Convention***

***Biến & Hàm:***

* *camelCase cho JavaScript/TypeScript/Java*  
* *snake\_case cho Python*  
* *Tên phải rõ ràng, mô tả được mục đích*  
* *Tránh viết tắt khó hiểu*  
* *Boolean nên bắt đầu bằng is/has/can/should*

***Ví dụ:***

*// ❌ Tệ*

*let d \= new Date();*

*let usr \= 'John';*

*let flag \= true;*

*// ✅ Tốt*

*let currentDate \= new Date();*

*let userName \= 'John';*

*let isLoggedIn \= true;*

*let hasPermission \= false;*

***Class & Interface:***

* *PascalCase*  
* *Tên noun, mô tả rõ object*  
* *Interface có thể prefix với "I" (tùy convention của team)*

*// ✅ Tốt*

*class UserAccount { }*

*interface IUserRepository { }*

*class PaymentService { }*

***Constants:***

* *UPPER\_SNAKE\_CASE cho constants toàn cục*  
* *camelCase cho const trong scope nhỏ*

*const MAX\_RETRY\_COUNT \= 3;*

*const API\_BASE\_URL \= 'https://api.example.com';*

*function calculateTotal() {*

  *const taxRate \= 0.1; // OK trong scope nhỏ*

*}*

***Files & Folders:***

* *kebab-case hoặc camelCase (thống nhất trong project)*  
* *Component React: PascalCase (UserProfile.tsx)*  
* *Utilities/helpers: camelCase (dateUtils.js)*

### ***2.2. Code Structure & Organization***

***Tổ chức thư mục:***

*src/*

*├── components/       \# UI components*

*│   ├── common/      \# Shared components*

*│   └── features/    \# Feature-specific components*

*├── services/        \# API calls, business logic*

*├── utils/           \# Helper functions*

*├── hooks/           \# Custom hooks (React)*

*├── constants/       \# Constants*

*├── types/           \# Type definitions*

*├── styles/          \# Global styles*

*├── assets/          \# Images, fonts, etc.*

*└── config/          \# Configuration files*

***Quy tắc:***

* *Một file chỉ làm một việc*  
* *Giới hạn độ dài file (\< 300 lines)*  
* *Nhóm import theo thứ tự: external → internal → relative*  
* *Export ở cuối file (hoặc inline nếu cần)*

***Import Order:***

*// 1\. External libraries*

*import React from 'react';*

*import { Button } from 'antd';*

*// 2\. Internal modules*

*import { UserService } from '@/services';*

*import { formatDate } from '@/utils';*

*// 3\. Relative imports*

*import { Header } from './components';*

*import styles from './styles.module.css';*

### ***2.3. Formatting Rules***

***Sử dụng Prettier/ESLint:***

* *Config thống nhất cho cả team*  
* *Auto-format on save*  
* *Chạy lint check trước khi commit (pre-commit hook)*

***Cài đặt cơ bản:***

*{*

  *"printWidth": 100,*

  *"tabWidth": 2,*

  *"useTabs": false,*

  *"semi": true,*

  *"singleQuote": true,*

  *"trailingComma": "es5",*

  *"bracketSpacing": true,*

  *"arrowParens": "avoid"*

*}*

***Code style:***

* *Indent: 2 spaces (hoặc 4 spaces \- thống nhất team)*  
* *Dòng code tối đa 100-120 ký tự*  
* *Luôn dùng dấu ngoặc nhọn cho if/else/for*  
* *Thêm space quanh operators*  
* *Kết thúc file bằng newline*

### ***2.4. Best Practices***

***DRY \- Don't Repeat Yourself:***

*// ❌ Tệ*

*function getUserFullName(user) {*

  *return user.firstName \+ ' ' \+ user.lastName;*

*}*

*function getAdminFullName(admin) {*

  *return admin.firstName \+ ' ' \+ admin.lastName;*

*}*

*// ✅ Tốt*

*function getFullName(person) {*

  *return \`${person.firstName} ${person.lastName}\`;*

*}*

***KISS \- Keep It Simple, Stupid:***

*// ❌ Phức tạp không cần thiết*

*function isEligible(user) {*

  *return user.age \>= 18 ? (user.isVerified ? true : false) : false;*

*}*

*// ✅ Đơn giản*

*function isEligible(user) {*

  *return user.age \>= 18 && user.isVerified;*

*}*

***SOLID Principles:***

* *Single Responsibility: Mỗi class/function làm 1 việc*  
* *Open/Closed: Mở để mở rộng, đóng để sửa đổi*  
* *Liskov Substitution: Subclass có thể thay thế parent*  
* *Interface Segregation: Chia nhỏ interface*  
* *Dependency Inversion: Phụ thuộc vào abstraction*

***Error Handling:***

*// ✅ Tốt*

*async function fetchUser(id) {*

  *try {*

    *const response \= await api.getUser(id);*

    *return response.data;*

  *} catch (error) {*

    *console.error('Failed to fetch user:', error);*

    *throw new Error('Unable to load user data');*

  *}*

*}*

***Tránh Magic Numbers:***

*// ❌ Tệ*

*if (user.role \=== 1\) { }*

*// ✅ Tốt*

*const USER\_ROLES \= {*

  *ADMIN: 1,*

  *USER: 2,*

  *GUEST: 3*

*};*

*if (user.role \=== USER\_ROLES.ADMIN) { }*

---

## ***3\. CODE REVIEW PROCESS***

### ***3.1. Review Checklist***

***Functionality:***

* *\[ \] Code hoạt động đúng như mô tả*  
* *\[ \] Không có bugs rõ ràng*  
* *\[ \] Edge cases được xử lý*  
* *\[ \] Error handling đầy đủ*

***Code Quality:***

* *\[ \] Code dễ đọc, dễ hiểu*  
* *\[ \] Tuân thủ coding convention*  
* *\[ \] Không có code duplicate*  
* *\[ \] Logic đơn giản, không over-engineering*

***Performance:***

* *\[ \] Không có vòng lặp không cần thiết*  
* *\[ \] Database queries được optimize*  
* *\[ \] Không có memory leaks*  
* *\[ \] Xử lý async/await đúng cách*

***Security:***

* *\[ \] Không hardcode sensitive data*  
* *\[ \] Input validation đầy đủ*  
* *\[ \] Không có SQL injection risks*  
* *\[ \] Authentication/authorization đúng*

***Testing:***

* *\[ \] Có test cases đầy đủ*  
* *\[ \] Test coverage đạt yêu cầu (\>80%)*  
* *\[ \] Tests pass trên CI/CD*

***Documentation:***

* *\[ \] Comments cho logic phức tạp*  
* *\[ \] API documentation được update*  
* *\[ \] README được cập nhật (nếu cần)*

### ***3.2. Reviewer Responsibilities***

***Vai trò của Reviewer:***

* *Review trong vòng 24h (hoặc sớm hơn nếu urgent)*  
* *Đọc và hiểu code kỹ càng*  
* *Test code trên local nếu cần*  
* *Đưa feedback constructive, không mang tính cá nhân*  
* *Explain lý do khi request changes*

***Cách đưa feedback:***

*// ❌ Không tốt*

*"Code này tệ quá, viết lại đi"*

*// ✅ Tốt*

*"Đoạn này có thể optimize bằng cách sử dụng Array.map()* 

*thay vì for loop để code ngắn gọn và dễ đọc hơn.* 

*Ví dụ: \`users.map(u \=\> u.name)\`"*

***Phân loại comments:***

* *🔴 **Blocking**: Phải fix mới được merge*  
* *🟡 **Suggestion**: Nên sửa nhưng không bắt buộc*  
* *💡 **Question**: Thắc mắc, cần clarification*  
* *👍 **Praise**: Khen code tốt (quan trọng\!)*

### ***3.3. Approval Requirements***

***Điều kiện để approve:***

* *Code đạt tiêu chuẩn quality*  
* *Không có blocking issues*  
* *Tests pass*  
* *Documentation đầy đủ*

***Khi nào Request Changes:***

* *Có bugs nghiêm trọng*  
* *Không tuân thủ convention*  
* *Performance issues*  
* *Security vulnerabilities*  
* *Test coverage không đủ*

***Timeline:***

* *Minor changes: 2-4 hours*  
* *Medium PR: 24 hours*  
* *Large PR: 48 hours*  
* *Hotfix: ASAP (\< 1 hour)*

### ***3.4. Feedback Guidelines***

***Cho người được review:***

* *Đón nhận feedback tích cực*  
* *Không defensive, giải thích lý do nếu không đồng ý*  
* *Respond tất cả comments*  
* *Fix hoặc reply cho mỗi comment*  
* *Thank reviewer*

***Cho reviewer:***

* *Focus vào code, không phê bình cá nhân*  
* *Giải thích "tại sao", không chỉ "sửa thế này"*  
* *Khen những điểm tốt*  
* *Suggest solutions cụ thể*  
* *Sử dụng questions thay vì commands*

---

## 

## ***4\. TESTING REQUIREMENTS***

### ***4.1. Unit Test Coverage***

***Mục tiêu:***

* *Code coverage tối thiểu: 80%*  
* *Critical paths: 100%*  
* *Utility functions: 100%*

***Những gì cần test:***

* *Business logic*  
* *Utility functions*  
* *API endpoints*  
* *Data transformations*  
* *Error handling*  
* *Edge cases*

***Những gì không cần test:***

* *Third-party libraries*  
* *Configuration files*  
* *Simple getters/setters*

### ***4.2. Integration Testing***

***Scope:***

* *API integration*  
* *Database operations*  
* *External services*  
* *End-to-end workflows*

***Best practices:***

* *Sử dụng test database riêng*  
* *Mock external services*  
* *Clean up data sau mỗi test*  
* *Test cả success và failure cases*

### ***4.3. Test Naming Convention***

***Format:***

*describe('ComponentName/FunctionName', () \=\> {*

  *it('should \[expected behavior\] when \[condition\]', () \=\> {*

    *// test code*

  *});*

*});*

***Ví dụ:***

*describe('UserService', () \=\> {*

  *describe('login', () \=\> {*

    *it('should return user token when credentials are valid', async () \=\> {*

      *// Arrange*

      *const credentials \= { email: 'test@example.com', password: 'pass123' };*

      

      *// Act*

      *const result \= await UserService.login(credentials);*

      

      *// Assert*

      *expect(result.token).toBeDefined();*

    *});*

    *it('should throw error when email is invalid', async () \=\> {*

      *const credentials \= { email: 'invalid', password: 'pass123' };*

      

      *await expect(UserService.login(credentials))*

        *.rejects.toThrow('Invalid email');*

    *});*

  *});*

*});*

### ***4.4. Test Data Management***

***Test fixtures:***

* *Tạo data factories cho test*  
* *Sử dụng realistic data*  
* *Tránh hardcode values*

*// test/factories/user.factory.js*

*export const createUser \= (overrides \= {}) \=\> ({*

  *id: faker.datatype.uuid(),*

  *email: faker.internet.email(),*

  *firstName: faker.name.firstName(),*

  *lastName: faker.name.lastName(),*

  *...overrides*

*});*

*// Usage*

*const testUser \= createUser({ email: 'specific@test.com' });*

***Quy tắc:***

* *Mỗi test phải độc lập*  
* *Không phụ thuộc vào thứ tự chạy test*  
* *Clean up sau mỗi test*  
* *Không share state giữa tests*

---

## 

## ***5\. DOCUMENTATION***

### ***5.1. Code Comments***

***Khi nào cần comment:***

* *Logic phức tạp, không tự giải thích*  
* *Workarounds hoặc hacks*  
* *Business rules quan trọng*  
* *TODOs, FIXMEs*  
* *Regex patterns*  
* *Constants không rõ ràng*

***Khi nào KHÔNG cần comment:***

* *Code tự giải thích*  
* *Mô tả những gì code đang làm (nên rename cho rõ thay vì comment)*

*// ❌ Comment không cần thiết*

*// Get user by id*

*function getUserById(id) { }*

*// Loop through users*

*for (let i \= 0; i \< users.length; i++) { }*

*// ✅ Comment hữu ích*

*// Workaround: API trả về null thay vì empty array*

*// TODO: Update khi API fix bug này (ticket: ISSUE-123)*

*const items \= response.data || \[\];*

*// Regex: Validate email theo RFC 5322*

*const EMAIL\_REGEX \= /^\[a-zA-Z0-9.\_%+-\]+@\[a-zA-Z0-9.-\]+\\.\[a-zA-Z\]{2,}$/;*

***JSDoc cho functions:***

*/\*\**

 *\* Tính tổng giá trị đơn hàng sau khi áp dụng giảm giá*

 *\** 

 *\* @param {number} originalPrice \- Giá gốc*

 *\* @param {number} discountPercent \- Phần trăm giảm giá (0-100)*

 *\* @returns {number} Giá sau giảm*

 *\* @throws {Error} Nếu giá trị không hợp lệ*

 *\*/*

*function calculateDiscountedPrice(originalPrice, discountPercent) {*

  *if (originalPrice \< 0 || discountPercent \< 0 || discountPercent \> 100\) {*

    *throw new Error('Invalid input values');*

  *}*

  *return originalPrice \* (1 \- discountPercent / 100);*

*}*

### ***5.2. README Requirements***

***Mỗi project phải có README chứa:***

* *Tên project và mô tả ngắn*  
* *Prerequisites (Node version, dependencies)*  
* *Hướng dẫn cài đặt*  
* *Cấu hình environment variables*  
* *Hướng dẫn chạy project*  
* *Hướng dẫn chạy tests*  
* *Project structure*  
* *Deployment instructions*  
* *Liên hệ/Contributors*

***Template:***

*\# Project Name*

*Mô tả ngắn về project*

*\#\# Prerequisites*

*\- Node.js \>= 16.x*

*\- npm \>= 8.x*

*\- PostgreSQL \>= 13*

*\#\# Installation*

*\\\`\\\`\\\`bash*

*npm install*

*cp .env.example .env*

*\# Update .env với config của bạn*

*\\\`\\\`\\\`*

*\#\# Running the app*

*\\\`\\\`\\\`bash*

*\# Development*

*npm run dev*

*\# Production*

*npm run build*

*npm start*

*\\\`\\\`\\\`*

*\#\# Testing*

*\\\`\\\`\\\`bash*

*npm test*

*npm run test:coverage*

*\\\`\\\`\\\`*

*\#\# Environment Variables*

*\- \`DATABASE\_URL\`: Connection string cho database*

*\- \`JWT\_SECRET\`: Secret key cho JWT*

*\- \`PORT\`: Port để chạy app (default: 3000\)*

*\#\# Project Structure*

*\\\`\\\`\\\`*

*src/*

*├── controllers/*

*├── services/*

*├── models/*

*└── routes/*

*\\\`\\\`\\\`*

*\#\# Deployment*

*\[Hướng dẫn deploy lên staging/production\]*

*\#\# Contributors*

*\- Developer 1 (email@example.com)*

*\- Developer 2 (email@example.com)*

### ***5.3. API Documentation***

***Sử dụng OpenAPI/Swagger:***

* *Document tất cả endpoints*  
* *Mô tả request/response format*  
* *Ví dụ cụ thể*  
* *Error codes*

***Format:***

*/api/users/{id}:*

  *get:*

    *summary: Lấy thông tin user theo ID*

    *parameters:*

      *\- name: id*

        *in: path*

        *required: true*

        *schema:*

          *type: string*

    *responses:*

      *200:*

        *description: Successful response*

        *content:*

          *application/json:*

            *schema:*

              *$ref: '\#/components/schemas/User'*

      *404:*

        *description: User not found*

### ***5.4. Technical Design Docs***

***Khi nào cần viết:***

* *Tính năng mới lớn*  
* *Thay đổi architecture*  
* *Migration data*  
* *Integration với hệ thống mới*

***Nội dung:***

* *Problem statement*  
* *Proposed solution*  
* *Alternatives considered*  
* *Architecture diagram*  
* *Data models*  
* *API design*  
* *Security considerations*  
* *Performance impact*  
* *Testing strategy*  
* *Rollout plan*

---

## ***6\. SECURITY GUIDELINES***

### ***6.1. Sensitive Data Handling***

***Quy tắc vàng:***

* *❌ KHÔNG BAO GIỜ commit credentials vào Git*  
* *❌ KHÔNG hardcode API keys, passwords*  
* *❌ KHÔNG log sensitive data*  
* *✅ Sử dụng environment variables*  
* *✅ Sử dụng secret management tools*

***Environment Variables:***

*// ❌ Tệ*

*const API\_KEY \= 'sk\_live\_abcd1234';*

*// ✅ Tốt*

*const API\_KEY \= process.env.API\_KEY;*

***Git secrets:***

*\# Thêm vào .gitignore*

*.env*

*.env.local*

*\*.pem*

*\*.key*

*secrets/*

***Xử lý passwords:***

*// ✅ Hash password trước khi lưu*

*const bcrypt \= require('bcrypt');*

*const saltRounds \= 10;*

*async function hashPassword(password) {*

  *return await bcrypt.hash(password, saltRounds);*

*}*

*// ✅ So sánh password*

*async function verifyPassword(password, hash) {*

  *return await bcrypt.compare(password, hash);*

*}*

### ***6.2. Authentication/Authorization***

***JWT Best Practices:***

*// Set expiration time*

*const token \= jwt.sign(*

  *{ userId: user.id },*

  *process.env.JWT\_SECRET,*

  *{ expiresIn: '24h' }*

*);*

*// Verify token*

*function authenticateToken(req, res, next) {*

  *const token \= req.headers\['authorization'\]?.split(' ')\[1\];*


  *if (\!token) {*

    *return res.status(401).json({ error: 'No token provided' });*

  *}*


  *jwt.verify(token, process.env.JWT\_SECRET, (err, user) \=\> {*

    *if (err) {*

      *return res.status(403).json({ error: 'Invalid token' });*

    *}*

    *req.user \= user;*

    *next();*

  *});*

*}*

***Authorization:***

*// Check permissions*

*function authorize(allowedRoles) {*

  *return (req, res, next) \=\> {*

    *if (\!allowedRoles.includes(req.user.role)) {*

      *return res.status(403).json({* 

        *error: 'Insufficient permissions'* 

      *});*

    *}*

    *next();*

  *};*

*}*

*// Usage*

*app.delete('/users/:id',* 

  *authenticateToken,*

  *authorize(\['admin'\]),*

  *deleteUser*

*);*

### ***6.3. Input Validation***

***Validate tất cả input:***

*// Sử dụng validation library (Joi, Yup, Zod)*

*const Joi \= require('joi');*

*const userSchema \= Joi.object({*

  *email: Joi.string().email().required(),*

  *password: Joi.string().min(8).required(),*

  *age: Joi.number().integer().min(18).max(120)*

*});*

*function validateUser(req, res, next) {*

  *const { error } \= userSchema.validate(req.body);*

  *if (error) {*

    *return res.status(400).json({* 

      *error: error.details\[0\].message* 

    *});*

  *}*

  *next();*

*}*

***Sanitize input:***

*// Tránh XSS*

*const escapeHtml \= (text) \=\> {*

  *return text*

    *.replace(/&/g, '\&amp;')*

    *.replace(/\</g, '\&lt;')*

    *.replace(/\>/g, '\&gt;')*

    *.replace(/"/g, '\&quot;')*

    *.replace(/'/g, '&\#039;');*

*};*

*// SQL Injection prevention \- dùng parameterized queries*

*// ❌ Tệ \- SQL Injection risk*

*const query \= \`SELECT \* FROM users WHERE email \= '${email}'\`;*

*// ✅ Tốt*

*const query \= 'SELECT \* FROM users WHERE email \= ?';*

*db.query(query, \[email\]);*

### ***6.4. Security Checklist***

***Before deployment:***

* *\[ \] Không có hardcoded secrets*  
* *\[ \] Environment variables được config đúng*  
* *\[ \] HTTPS enabled (production)*  
* *\[ \] CORS configured properly*  
* *\[ \] Rate limiting implemented*  
* *\[ \] Input validation đầy đủ*  
* *\[ \] SQL injection prevented*  
* *\[ \] XSS protection*  
* *\[ \] CSRF protection (nếu cần)*  
* *\[ \] Security headers configured*  
* *\[ \] Dependencies up-to-date (no known vulnerabilities)*  
* *\[ \] Error messages không leak sensitive info*  
* *\[ \] Logging không chứa sensitive data*

***Security Headers:***

*// Express.js example*

*app.use(helmet()); // Tự động set nhiều security headers*

*// Hoặc manual*

*app.use((req, res, next) \=\> {*

  *res.setHeader('X-Content-Type-Options', 'nosniff');*

  *res.setHeader('X-Frame-Options', 'DENY');*

  *res.setHeader('X-XSS-Protection', '1; mode=block');*

  *res.setHeader('Strict-Transport-Security', 'max-age=31536000');*

  *next();*

*});*

## 

## ***7\. DEVELOPMENT ENVIRONMENT***

## 

## ***8\. DEPLOYMENT & RELEASE***

## 

## ***9\. COMMUNICATION & COLLABORATION***

### ***9.1. Daily Standup***

***Format:***

* *Thời gian: 15 phút, cùng giờ mỗi ngày*  
* *Mỗi người trả lời 3 câu hỏi:*  
  1. *Hôm qua làm gì?*  
  2. *Hôm nay sẽ làm gì?*  
  3. *Có blockers gì không?*

***Best practices:***

* *Đúng giờ, không trễ*  
* *Keep it short và focus*  
* *Không technical deep-dive (thảo luận sau)*  
* *Update task status trước standup*  
* *Blockers phải được giải quyết ngay*

### ***9.2. Task Management***

***Sử dụng Jira/Trello/Linear:***

***Task states:***

* *📋 Backlog: Tasks chưa được ưu tiên*  
* *📝 To Do: Ready để làm*  
* *🏃 In Progress: Đang làm*  
* *👀 In Review: Đang code review*  
* *✅ Done: Hoàn thành*  
* *🚫 Blocked: Bị block*

***Task description phải có:***

* *Acceptance criteria rõ ràng*  
* *Design mockups (nếu có)*  
* *Technical notes*  
* *Related tasks*  
* *Estimated time*

***Cập nhật tasks:***

* *Move task khi start/finish*  
* *Comment progress hàng ngày*  
* *Update time spent*  
* *Tag người cần review*

### ***9.3. Notification Channels***

***Slack/Discord channels:***

* *`#dev-general`: Thảo luận chung*  
* *`#dev-backend`: Backend issues*  
* *`#dev-frontend`: Frontend issues*  
* *`#deployments`: Deploy notifications*  
* *`#incidents`: Production issues*  
* *`#code-review`: PR reviews*  
* *`#random`: Off-topic*

***When to use what:***

* ***Urgent (\< 1h)**: Phone call hoặc @mention*  
* ***Important (\< 4h)**: Direct message*  
* ***Normal**: Channel message*  
* ***FYI**: Thread reply*  
* ***Documentation**: Wiki/Confluence*

***Communication guidelines:***

* *Response time: \< 2 hours (working hours)*  
* *Use threads để organize conversations*  
* *@mention khi cần attention cụ thể*  
* *Avoid @here/@channel unless emergency*

### ***9.4. Knowledge Sharing***

***Weekly Tech Talks:***

* *Mỗi tuần 1 người present (30 phút)*  
* *Topics: New tech, lessons learned, best practices*  
* *Record và share slides*

***Documentation:***

* *Maintain team wiki*  
* *Document common issues & solutions*  
* *Share useful resources*  
* *Update onboarding guides*

***Code Reviews as Learning:***

* *Explain "why" trong comments*  
* *Share interesting patterns*  
* *Link to documentation/articles*

***Pair Programming:***

* *Schedule khi làm features phức tạp*  
* *Rotate pairs thường xuyên*  
* *Junior-Senior pairing*

## 

## ***10\. QUALITY ASSURANCE***

### ***10.1. Definition of Done***

***Task chỉ được consider "Done" khi:***

* *\[ \] Code complete và tuân thủ convention*  
* *\[ \] Unit tests viết và pass (coverage \>= 80%)*  
* *\[ \] Integration tests pass (nếu có)*  
* *\[ \] Code review approved*  
* *\[ \] No blocking bugs*  
* *\[ \] Documentation updated*  
* *\[ \] Merged vào branch target*  
* *\[ \] Deployed lên môi trường test*  
* *\[ \] QA/manual testing passed*  
* *\[ \] Product Owner/Stakeholder approved*

### ***10.2. Bug Tracking***

***Bug severity:***

* *🔴 **Critical**: App crash, data loss, security breach*  
  * *Fix: Immediately (hotfix)*  
  * *Example: Payment processing fails*  
* *🟠 **High**: Major feature không hoạt động*  
  * *Fix: Within 24 hours*  
  * *Example: Cannot login*  
* *🟡 **Medium**: Feature hoạt động nhưng có issues*  
  * *Fix: Within 1 week*  
  * *Example: UI misalignment*  
* *🟢 **Low**: Minor issues, cosmetic*  
  * *Fix: Next sprint*  
  * *Example: Typo trong text*

***Bug report template:***

*\*\*Title\*\*: \[Component\] Brief description*

*\*\*Environment\*\*: Production/Staging/Local*

*\*\*Browser/Device\*\*: Chrome 118 / iPhone 14 Pro*

*\*\*User Role\*\*: Admin/User*

*\*\*Steps to Reproduce\*\*:*

*1\. Go to login page*

*2\. Enter invalid email*

*3\. Click submit*

*\*\*Expected Result\*\*:*

*Show validation error message*

*\*\*Actual Result\*\*:*

*App crashes*

*\*\*Screenshots/Videos\*\*:*

*\[Attach files\]*

*\*\*Console Errors\*\*:*

*TypeError: Cannot read property 'email' of undefined*

*\*\*Additional Context\*\*:*

*Occurs only when email field is empty*

### ***10.3. Performance Standards***

***Response Time:***

* *API endpoints: \< 500ms (p95)*  
* *Page load: \< 3s (First Contentful Paint)*  
* *Interactive: \< 5s (Time to Interactive)*

***Database:***

* *Query time: \< 100ms (simple queries)*  
* *Complex queries: \< 1s*  
* *Connection pool: 10-20 connections*

***Frontend:***

* *Bundle size: \< 500KB (main bundle)*  
* *Images: Optimized, lazy loading*  
* *Lighthouse score: \> 90*

***Monitoring:***

* *Set up APM (Application Performance Monitoring)*  
* *Track error rates*  
* *Monitor resource usage*  
* *Alert on anomalies*

### ***10.4. Code Quality Metrics***

***Metrics to track:***

* *Code coverage: \>= 80%*  
* *Code duplication: \< 5%*  
* *Cyclomatic complexity: \< 10 per function*  
* *Code smell violations: 0 (SonarQube)*  
* *Technical debt ratio: \< 5%*

***Code review metrics:***

* *Average PR size: \< 400 lines changed*  
* *Review time: \< 24 hours*  
* *Number of review iterations: \< 3*

***Tools:***

* *SonarQube: Code quality analysis*  
* *CodeClimate: Maintainability score*  
* *Codecov: Test coverage*  
* *Snyk: Security vulnerabilities*

***Quality gates:***

* *Cannot merge if coverage drops*  
* *Cannot deploy with high/critical vulnerabilities*  
* *Code smell blocking issues must be fixed*

## 

## ***CẬP NHẬT***

***Version**: 1.0.0 **Ngày cập nhật**: 17/11/2025 **Người maintain**: HO TIEN KY*

***Changelog:***

* *Initial release*

***Feedback:** Mọi góp ý để cải thiện quy định này, vui lòng tạo issue hoặc liên hệ Dev Team Lead.*

---

*Tài liệu này là living document và sẽ được cập nhật thường xuyên dựa trên feedback và best practices mới.*

