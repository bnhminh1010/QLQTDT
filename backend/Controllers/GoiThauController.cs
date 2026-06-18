using FluentValidation;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.DTOs.GoiThau;
using QLQTDT.Api.Models.DTOs.HoSoDuThau;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;
using ValidationResult = FluentValidation.Results.ValidationResult;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/goi-thau")]
[Authorize]
public class GoiThauController : BaseController<GoiThau, IGoiThauService>
{
    private readonly IHoSoDuThauService _hoSoService;
    private readonly IWorkflowEngineService _workflowEngine;

    public GoiThauController(IGoiThauService service, IHoSoDuThauService hoSoService, IWorkflowEngineService workflowEngine)
        : base(service)
    {
        _hoSoService = hoSoService;
        _workflowEngine = workflowEngine;
    }

    [NonAction]
    public override Task<ActionResult<ApiResponse<PagedResult<GoiThau>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => throw new NotSupportedException();

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<GoiThauDto>>>> Search(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? trangThai = null)
    {
        var result = await _service.SearchAsync(page, pageSize, trangThai);
        return Ok(ApiResponse<PagedResult<GoiThauDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<GoiThau>>> Create(
        [FromBody] CreateGoiThauDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id },
            ApiResponse<GoiThau>.Ok(created, "Tạo gói thầu thành công"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<GoiThau>>> Update(
        int id, [FromBody] UpdateGoiThauDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);
        return Ok(ApiResponse<GoiThau>.Ok(updated, "Cập nhật gói thầu thành công"));
    }

    [HttpGet("{id}/chi-tiet")]
    public async Task<ActionResult<ApiResponse<GoiThauDetailDto>>> GetChiTiet(int id)
    {
        var detail = await _service.GetChiTietAsync(id);
        return Ok(ApiResponse<GoiThauDetailDto>.Ok(detail));
    }

    [HttpPost("{id}/process-step")]
    [HasPermission("WORKFLOW.PROCESS")]
    public async Task<ActionResult<ApiResponse<ProcessStepResponse>>> ProcessStep(
        int id,
        [FromBody] ProcessStepRequest request,
        [FromServices] IValidator<ProcessStepRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToErrorResponse(validation));

        var result = await _workflowEngine.ProcessStepAsync(id, request);
        return Ok(ApiResponse<ProcessStepResponse>.Ok(result, "Xử lý bước workflow thành công"));
    }

    /// <summary>
    /// BA user-driven flow: Duyệt bước hiện tại → chuyển step kế hoặc complete
    /// </summary>
    [HttpPost("{id}/duyet")]
    [HasPermission("WORKFLOW.PROCESS")]
    public async Task<ActionResult<ApiResponse<ProcessStepResponse>>> Duyet(
        int id,
        [FromBody] DuyetStepRequest request,
        [FromServices] IValidator<DuyetStepRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToErrorResponse(validation));

        var engineRequest = new ProcessStepRequest
        {
            HanhDong = WorkflowHanhDong.DUYET,
            GhiChu = request.GhiChu,
            RowVersion = request.RowVersion
        };
        var result = await _workflowEngine.ProcessStepAsync(id, engineRequest);
        return Ok(ApiResponse<ProcessStepResponse>.Ok(result, "Duyệt bước thành công"));
    }

    /// <summary>
    /// BA user-driven flow: Không duyệt bước hiện tại
    /// </summary>
    [HttpPost("{id}/khong-duyet")]
    [HasPermission("WORKFLOW.PROCESS")]
    public async Task<ActionResult<ApiResponse<ProcessStepResponse>>> KhongDuyet(
        int id,
        [FromBody] KhongDuyetStepRequest request,
        [FromServices] IValidator<KhongDuyetStepRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToErrorResponse(validation));

        var engineRequest = new ProcessStepRequest
        {
            HanhDong = WorkflowHanhDong.KHONG_DUYET,
            GhiChu = request.GhiChu,
            RowVersion = request.RowVersion
        };
        var result = await _workflowEngine.ProcessStepAsync(id, engineRequest);
        return Ok(ApiResponse<ProcessStepResponse>.Ok(result, "Từ chối bước thành công"));
    }

    /// <summary>
    /// BA user-driven flow: Trả về bước trước
    /// </summary>
    [HttpPost("{id}/tra-ve")]
    [HasPermission("WORKFLOW.PROCESS")]
    public async Task<ActionResult<ApiResponse<ProcessStepResponse>>> TraVe(
        int id,
        [FromBody] TraVeStepRequest request,
        [FromServices] IValidator<TraVeStepRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToErrorResponse(validation));

        var engineRequest = new ProcessStepRequest
        {
            HanhDong = WorkflowHanhDong.TRA_VE,
            GhiChu = request.GhiChu,
            RowVersion = request.RowVersion
        };
        var result = await _workflowEngine.ProcessStepAsync(id, engineRequest);
        return Ok(ApiResponse<ProcessStepResponse>.Ok(result, "Trả về bước thành công"));
    }

    /// <summary>
    /// Rollback bước hiện tại về bước trước (POST /rollback)
    /// </summary>
    [HttpPost("{id}/rollback")]
    [HasPermission("WORKFLOW.PROCESS")]
    public async Task<ActionResult<ApiResponse<ProcessStepResponse>>> Rollback(
        int id,
        [FromBody] RollbackStepRequest request,
        [FromServices] IValidator<RollbackStepRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToErrorResponse(validation));

        var engineRequest = new ProcessStepRequest
        {
            HanhDong = WorkflowHanhDong.ROLLBACK,
            GhiChu = request.GhiChu,
            RowVersion = request.RowVersion
        };
        var result = await _workflowEngine.ProcessStepAsync(id, engineRequest);
        return Ok(ApiResponse<ProcessStepResponse>.Ok(result, "Rollback bước thành công"));
    }

    /// <summary>
    /// Bỏ qua bước hiện tại (POST /skip)
    /// </summary>
    [HttpPost("{id}/skip")]
    [HasPermission("WORKFLOW.PROCESS")]
    public async Task<ActionResult<ApiResponse<ProcessStepResponse>>> Skip(
        int id,
        [FromBody] SkipStepRequest request,
        [FromServices] IValidator<SkipStepRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToErrorResponse(validation));

        var engineRequest = new ProcessStepRequest
        {
            HanhDong = WorkflowHanhDong.SKIP,
            GhiChu = request.GhiChu,
            RowVersion = request.RowVersion
        };
        var result = await _workflowEngine.ProcessStepAsync(id, engineRequest);
        return Ok(ApiResponse<ProcessStepResponse>.Ok(result, "Bỏ qua bước thành công"));
    }

    /// <summary>
    /// Chuyển giao bước cho người xử lý khác (POST /reassign)
    /// </summary>
    [HttpPost("{id}/reassign")]
    [HasPermission("WORKFLOW.PROCESS")]
    public async Task<ActionResult<ApiResponse<ProcessStepResponse>>> Reassign(
        int id,
        [FromBody] ReassignStepRequest request,
        [FromServices] IValidator<ReassignStepRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToErrorResponse(validation));

        var engineRequest = new ProcessStepRequest
        {
            HanhDong = WorkflowHanhDong.REASSIGN,
            GhiChu = request.GhiChu,
            NguoiDuocGiaoId = request.NguoiDuocGiaoId,
            RowVersion = request.RowVersion
        };
        var result = await _workflowEngine.ProcessStepAsync(id, engineRequest);
        return Ok(ApiResponse<ProcessStepResponse>.Ok(result, "Chuyển giao bước thành công"));
    }

    [HttpPost("{id}/start-workflow")]
    [HasPermission("WORKFLOW.CHOOSE")]
    public async Task<ActionResult<ApiResponse<WorkflowInstanceDto>>> StartWorkflow(
        int id,
        [FromBody] StartWorkflowRequest request,
        [FromServices] IValidator<StartWorkflowRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ToErrorResponse(validation));

        var result = await _workflowEngine.StartWorkflowAsync(id, request);
        return Ok(ApiResponse<WorkflowInstanceDto>.Ok(result, "Khởi tạo workflow thành công"));
    }

    [AllowAnonymous]
    [HttpGet("{id}/lich-su-trang-thai")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LichSuTrangThaiGoiThauDto>>>> GetLichSuTrangThai(int id)
    {
        if (User?.Identity?.IsAuthenticated != true)
            return StatusCode(
                StatusCodes.Status401Unauthorized,
                ApiResponse<IReadOnlyList<LichSuTrangThaiGoiThauDto>>.Fail("Bạn chưa đăng nhập."));

        var permissionsClaim = User.FindFirstValue("permissions");
        var hasPermission = permissionsClaim?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Contains("GOITHAU.VIEW_STATUS_HISTORY", StringComparer.OrdinalIgnoreCase) == true;

        if (!hasPermission)
            return StatusCode(
                StatusCodes.Status403Forbidden,
                ApiResponse<IReadOnlyList<LichSuTrangThaiGoiThauDto>>.Fail("Bạn không có quyền xem lịch sử trạng thái gói thầu."));

        var result = await _service.GetLichSuTrangThaiAsync(id);
        return Ok(ApiResponse<IReadOnlyList<LichSuTrangThaiGoiThauDto>>.Ok(result));
    }

    [HttpPost("{id}/award")]
    [HasPermission("HOSODUTHAU.AWARD")]
    public async Task<ActionResult<ApiResponse<object?>>> Award(
        int id, [FromBody] AwardGoiThauRequest request)
    {
        await _hoSoService.AwardAsync(id, request);
        return Ok(ApiResponse<object?>.Ok(null, "Chọn nhà thầu trúng thầu thành công"));
    }

    [NonAction]
    public override Task<ActionResult<ApiResponse<GoiThau>>> Create(GoiThau entity)
        => throw new NotSupportedException("Sử dụng CreateGoiThauDto.");

    [NonAction]
    public override Task<ActionResult<ApiResponse<GoiThau>>> Update(int id, GoiThau entity)
        => throw new NotSupportedException("Sử dụng UpdateGoiThauDto.");

    private static ApiErrorResponse ToErrorResponse(ValidationResult validation)
    {
        return new ApiErrorResponse
        {
            Timestamp = DateTime.UtcNow,
            Status = 400,
            Error = "Validation Failed",
            Errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => char.ToLowerInvariant(g.Key[0]) + g.Key[1..],
                              g => g.First().ErrorMessage)
        };
    }
}