# Pseudocode: WorkflowEngine.cs

## Tổng quan

WorkflowEngine là state machine runtime core của hệ thống. Nó quản lý vòng đời của workflow instance, xử lý transition giữa các bước, phân công người xử lý, và ghi audit log.

---

## Cấu trúc lớp

```csharp
public class WorkflowEngine
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;

    public WorkflowEngine(AppDbContext db, INotificationService notificationService, IAuditService auditService)
    {
        _db = db;
        _notificationService = notificationService;
        _auditService = auditService;
    }
}
```

---

## 1. StartWorkflowAsync

Khởi tạo workflow instance cho gói thầu.

```
Input:  goiThauId (int), workflowId (int), nguoiTaoId (int)
Output: WorkflowInstance

Steps:
1. Validate:
   a. GoiThau tồn tại và TrangThai = "DU_THAO"
   b. Workflow template tồn tại
   c. Chưa có WorkflowInstance nào đang ACTIVE cho GoiThau này
   d. Workflow có ít nhất 1 BuocWorkflow

2. Tạo WorkflowInstance:
   - GoiThauId = goiThauId
   - WorkflowId = workflowId
   - TrangThai = "ACTIVE"
   - BuocHienTaiId = null (sẽ set sau)
   - NgayBatDau = DateTime.UtcNow

3. Lấy BuocWorkflow đầu tiên (SoThuTu = 1)

4. Set BuocHienTaiId = BuocWorkflow đầu tiên.Id

5. Tạo WorkflowStepInstance:
   - WorkflowInstanceId
   - BuocWorkflowId
   - TrangThai = "PENDING"
   - NgayBatDau = DateTime.UtcNow
   - HanXuLy = NgayBatDau + BuocWorkflow.SoNgaySLA (ngày)

6. Tạo WorkflowAssignment:
   - Tìm tất cả NguoiDung_VaiTro có VaiTroId = BuocWorkflow.VaiTroXuLyId
     và KhoaPhongId = GoiThau.KhoaPhongId
   - Với mỗi user: tạo WorkflowAssignment
     { WorkflowStepInstanceId, NguoiDuocGiaoId, DaXuLy = false }

7. Ghi WorkflowActionHistory:
   - WorkflowInstanceId
   - HanhDong = "START"
   - NguoiThucHienId = nguoiTaoId
   - NoiDung = "Khởi tạo workflow"
   - ThoiGian = DateTime.UtcNow

8. Tạo ThongBao cho mỗi người được gán:
   - TieuDe = "Có việc cần xử lý"
   - NoiDung = "Bạn được giao {BuocWorkflow.TenBuoc} cho gói thầu {GoiThau.TenGoiThau}"
   - Loai = "WORKFLOW_ASSIGNMENT"
   - NguoiNhanId = NguoiDuocGiaoId
   - ThamChieu: { Loai: "GoiThau", Id: goiThauId }

9. Return WorkflowInstance (kèm BuocHienTai, danh sách người xử lý)
```

---

## 2. ProcessStepAsync

Xử lý một bước workflow (Approve / Reject).

```
Input:  workflowInstanceId (int), nguoiXuLyId (int), hanhDong (string),
        ghiChu (string?), dinhKemFileIds (int[]?)
Output: WorkflowStepInstance (step mới nếu có)

Steps:
1. Validate:
   a. WorkflowInstance tồn tại, TrangThai = "ACTIVE"
   b. WorkflowStepInstance hiện tại tồn tại, TrangThai = "PENDING"
   c. Kiểm tra user được gán:
      - WorkflowAssignment có NguoiDuocGiaoId = nguoiXuLyId
      - Và DaXuLy = false
   d. Kiểm tra hanhDong hợp lệ:
      - Tìm ChuyenTiepWorkflow từ BuocHienTai
      - Nếu không tìm thấy transition cho hanhDong này → throw

2. Đánh dấu assignment đã xử lý:
   - WorkflowAssignment.DaXuLy = true
   - WorkflowAssignment.NgayXuLy = DateTime.UtcNow
   - WorkflowAssignment.HanhDong = hanhDong
   - WorkflowAssignment.GhiChu = ghiChu

3. Cập nhật WorkflowStepInstance hiện tại:
   - TrangThai = hanhDong == "APPROVE" ? "COMPLETED" : "REJECTED"
   - NgayHoanThanh = DateTime.UtcNow
   - GhiChu = ghiChu

4. Nếu hanhDong == "REJECT":
   a. Set WorkflowInstance.TrangThai = "REJECTED"
   b. Ghi ActionHistory { HanhDong: "REJECT" }
   c. Tạo ThongBao cho người tạo workflow (hoặc người xử lý step trước)
   d. Return step hiện tại

5. Nếu hanhDong == "APPROVE":
   a. Tìm BuocWorkflow kế tiếp:
      - Từ ChuyenTiepWorkflow.TuBuocId = BuocHienTai.BuocWorkflowId
      - Lấy DenBuocId → tìm BuocWorkflow
   b. Nếu có bước kế tiếp:
      - Tạo WorkflowStepInstance mới (giống StartWorkflow step 5)
      - Tạo WorkflowAssignment mới (giống StartWorkflow step 6)
      - Cập nhật WorkflowInstance.BuocHienTaiId = step mới.Id
      - Tạo ThongBao cho người xử lý mới
   c. Nếu không có bước kế tiếp (bước cuối):
      - Set WorkflowInstance.TrangThai = "COMPLETED"
      - Set WorkflowInstance.NgayKetThuc = DateTime.UtcNow
      - Cập nhật GoiThau.TrangThai (tuỳ business)

6. Ghi ActionHistory { HanhDong: hanhDong }

7. Return step instance (mới hoặc hiện tại)
```

---

## 3. GetPendingTasksAsync

Lấy danh sách pending tasks của user.

```
Input:  nguoiDungId (int)
Output: List<PendingTaskDto>

Steps:
1. Query WorkflowAssignment:
   - NguoiDuocGiaoId = nguoiDungId
   - DaXuLy = false
   JOIN WorkflowStepInstance
   JOIN WorkflowInstance
   JOIN GoiThau
   JOIN BuocWorkflow

2. Với mỗi assignment,  tính:
   - QuaHan = HanXuLy < DateTime.UtcNow

3. Return: { stepId, goiThauId, maGoiThau, tenGoiThau,
             buocTen, ngayGiao, hanXuLy, quaHan }
```

---

## 4. RollbackStepAsync

Quay lại bước trước đó.

```
Input:  workflowInstanceId (int), nguoiThucHienId (int), lyDo (string)

Steps:
1. Validate:
   a. WorkflowInstance tồn tại, TrangThai = "ACTIVE"
   b. Step hiện tại tồn tại, TrangThai = "PENDING"

2. Set step hiện tại:
   - TrangThai = "ROLLED_BACK"
   - NgayHoanThanh = DateTime.UtcNow

3. Tìm step trước đó (SoThuTu lớn nhất < SoThuTu hiện tại):
   - Set WorkflowStepInstance.TrangThai = "PENDING"
   - Delete WorkflowAssignment cũ (hoặc set DaXuLy = false)

4. Tạo WorkflowAssignment mới cho step trước:
   - Tìm lại user theo VaiTroXuLyId của step đó

5. Cập nhật WorkflowInstance.BuocHienTaiId = step trước.Id

6. Ghi ActionHistory { HanhDong: "ROLLBACK" }

7. Tạo ThongBao
```

---

## 5. SkipStepAsync

Bỏ qua bước hiện tại (nếu được phép).

```
Input:  workflowInstanceId (int), nguoiThucHienId (int)
Steps:
1. Validate:
   a. WorkflowInstance tồn tại, ACTIVE
   b. BuocWorkflow.ChoPhepBoQua = true

2. Set step TrangThai = "SKIPPED", NgayHoanThanh = now

3. Tìm step kế tiếp (qua transition), tạo step mới + assignment

4. Ghi ActionHistory { HanhDong: "SKIP" }
```

---

## 6. ReassignStepAsync

Chuyển người xử lý.

```
Input:  workflowStepInstanceId (int), nguoiDuocGiaoMoiId (int), lyDo (string)

Steps:
1. Validate: step tồn tại, PENDING, user mới tồn tại

2. Set WorkflowAssignment cũ:
   - DaXuLy = true
   - GhiChu = "Đã chuyển cho user #{nguoiDuocGiaoMoiId}: {lyDo}"

3. Tạo WorkflowAssignment mới cho nguoiDuocGiaoMoiId

4. Ghi ActionHistory { HanhDong: "REASSIGN" }

5. Tạo ThongBao cho user mới
```

---

## 7. CheckOverdueStepsAsync

Job chạy định kỳ kiểm tra steps quá hạn.

```
Input:  none (background job)
Output: List<OverdueTaskDto>

Steps:
1. Query tất cả WorkflowStepInstance:
   - TrangThai = "PENDING"
   - HanXuLy < DateTime.UtcNow
   JOIN WorkflowInstance, GoiThau, BuocWorkflow

2. Với mỗi step quá hạn:
   - Set flag QuaHan (trong response, hoặc cập nhật DB field nếu có)
   - Tạo ThongBao nhắc nhở cho người được gán
   - Tạo ThongBao cho admin/manager

3. Return danh sách steps quá hạn
```

---

## Transaction & Locking

- Mỗi method trong WorkflowEngine phải chạy trong **1 transaction**
- Dùng `IDbContextTransaction` với EF Core
- Optimistic locking cho WorkflowInstance (dùng `rowversion`/`Timestamp`):
  ```
  public class WorkflowInstance
  {
      public byte[] RowVersion { get; set; }
  }
  ```
- Khi ProcessStep, load WorkInstance với `.Where(x => x.RowVersion == expectedVersion)`
- Nếu conflict → retry (tối đa 3 lần)

---

## Exception Handling

| Exception | Status | Message |
|-----------|--------|---------|
| WorkflowNotFoundException | 404 | Workflow instance không tồn tại |
| StepNotFoundException | 404 | Step không tồn tại |
| InvalidTransitionException | 400 | Hành động không hợp lệ cho bước hiện tại |
| NotAssignedException | 403 | Bạn không được gán xử lý bước này |
| WorkflowCompletedException | 400 | Workflow đã hoàn thành |
| CannotSkipException | 400 | Bước này không được phép bỏ qua |
