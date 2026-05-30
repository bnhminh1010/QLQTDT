using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Workflow;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class WorkflowConfigService : IWorkflowConfigService
{
	private const int MaQuyTrinhSuffixLength = 3;

	private readonly AppDbContext _context;
	private readonly ILogger<WorkflowConfigService> _logger;

	public WorkflowConfigService(AppDbContext context, ILogger<WorkflowConfigService> logger)
	{
		_context = context;
		_logger = logger;
	}

	public async Task<List<WorkflowListItemDto>> GetWorkflowsAsync()
	{
		return await _context.QuyTrinhs
			.Where(w => !w.DaXoa)
			.OrderBy(w => w.Id)
			.Select(w => new WorkflowListItemDto
			{
				Id = w.Id,
				TenWorkflow = w.TenQuyTrinh,
				MoTa = w.MoTa,
				HinhThucDauThauId = w.HinhThucDauThauId,
				TrangThaiHoatDong = w.TrangThaiHoatDong
			})
			.ToListAsync();
	}

	public async Task<WorkflowCreateResponse> CreateWorkflowAsync(WorkflowCreateRequest request)
	{
		if (request.HinhThucDauThauId.HasValue)
		{
			var hinhThucExists = await _context.HinhThucDauThaus
				.AnyAsync(h => h.Id == request.HinhThucDauThauId.Value);
			if (!hinhThucExists)
				throw new NotFoundException($"HinhThucDauThau not found: {request.HinhThucDauThauId.Value}");
		}

		var tenWorkflow = request.TenWorkflow.Trim();
		var moTa = request.MoTa?.Trim();

		var duplicate = await _context.QuyTrinhs.AnyAsync(w =>
			w.TenQuyTrinh == tenWorkflow
			&& w.HinhThucDauThauId == request.HinhThucDauThauId);
		if (duplicate)
			throw new ConflictException("Workflow name already exists for the same bidding method.");

		var entity = new QuyTrinh
		{
			MaQuyTrinh = await GenerateMaQuyTrinhAsync(),
			TenQuyTrinh = tenWorkflow,
			MoTa = moTa,
			HinhThucDauThauId = request.HinhThucDauThauId,
			TrangThaiHoatDong = true,
			DaXoa = false,
			NgayTao = DateTime.UtcNow,
			NgayCapNhat = DateTime.UtcNow
		};

		_context.QuyTrinhs.Add(entity);
		await _context.SaveChangesAsync();

		_logger.LogInformation("Created workflow: id={WorkflowId}, ma={MaQuyTrinh}", entity.Id, entity.MaQuyTrinh);

		return new WorkflowCreateResponse
		{
			Id = entity.Id,
			TenWorkflow = entity.TenQuyTrinh
		};
	}

	public async Task UpdateWorkflowAsync(int id, WorkflowUpdateRequest request)
	{
		var entity = await _context.QuyTrinhs.FindAsync(id)
			?? throw new NotFoundException($"Workflow not found: {id}");
		if (entity.DaXoa)
			throw new NotFoundException($"Workflow not found: {id}");

		if (request.HinhThucDauThauId.HasValue)
		{
			var hinhThucExists = await _context.HinhThucDauThaus
				.AnyAsync(h => h.Id == request.HinhThucDauThauId.Value);
			if (!hinhThucExists)
				throw new NotFoundException($"HinhThucDauThau not found: {request.HinhThucDauThauId.Value}");
		}

		if (request.TenWorkflow != null)
			entity.TenQuyTrinh = request.TenWorkflow.Trim();

		if (request.MoTa != null)
			entity.MoTa = request.MoTa.Trim();

		if (request.HinhThucDauThauId.HasValue)
			entity.HinhThucDauThauId = request.HinhThucDauThauId.Value;

		if (request.TrangThaiHoatDong.HasValue)
			entity.TrangThaiHoatDong = request.TrangThaiHoatDong.Value;

		var duplicate = await _context.QuyTrinhs.AnyAsync(w =>
			w.Id != id
			&& w.TenQuyTrinh == entity.TenQuyTrinh
			&& w.HinhThucDauThauId == entity.HinhThucDauThauId);
		if (duplicate)
			throw new ConflictException("Workflow name already exists for the same bidding method.");

		entity.NgayCapNhat = DateTime.UtcNow;
		await _context.SaveChangesAsync();

		_logger.LogInformation("Updated workflow: id={WorkflowId}", id);
	}

	public async Task DeleteWorkflowAsync(int id)
	{
		var entity = await _context.QuyTrinhs.FindAsync(id)
			?? throw new NotFoundException($"Workflow not found: {id}");
		if (entity.DaXoa)
			throw new NotFoundException($"Workflow not found: {id}");

		if (entity.TrangThaiHoatDong)
			throw new AppException(400, "HAS_INSTANCE", "Workflow dang hoat dong khong the xoa.");

		entity.DaXoa = true;
		entity.NgayCapNhat = DateTime.UtcNow;
		await _context.SaveChangesAsync();

		_logger.LogInformation("Soft-deleted workflow: id={WorkflowId}", id);
	}

	private async Task<string> GenerateMaQuyTrinhAsync()
	{
		var year = DateTime.UtcNow.Year;
		var prefix = $"QT-{year}-";

		var existingCodes = await _context.QuyTrinhs
			.Where(w => w.MaQuyTrinh.StartsWith(prefix))
			.Select(w => w.MaQuyTrinh)
			.ToListAsync();

		var maxNumber = existingCodes
			.Select(code => code.Length > prefix.Length ? code[prefix.Length..] : string.Empty)
			.Select(suffix => int.TryParse(suffix, out var number) ? number : 0)
			.DefaultIfEmpty(0)
			.Max();

		var nextNumber = maxNumber + 1;
		var formatted = nextNumber.ToString().PadLeft(MaQuyTrinhSuffixLength, '0');
		return $"{prefix}{formatted}";
	}
}
