using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Helpers;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.NhaThau;
using QLQTDT.Api.Models.Entities;
using System.Linq.Expressions;

namespace QLQTDT.Api.Services;

public class NhaThauService : BaseService<NhaThau>, INhaThauService
{
    public NhaThauService(AppDbContext db) : base(db)
    {
    }

    public async Task<PagedResult<NhaThau>> SearchAsync(int page, int pageSize, string? search)
    {
        Expression<Func<NhaThau, bool>>? filter = null;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            filter = n => n.TenCongTy.Contains(keyword)
                || n.MaSoThue.Contains(keyword)
                || (n.DiaChi != null && n.DiaChi.Contains(keyword))
                || (n.NguoiDaiDien != null && n.NguoiDaiDien.Contains(keyword))
                || (n.Email != null && n.Email.Contains(keyword))
                || (n.SoDienThoai != null && n.SoDienThoai.Contains(keyword));
        }

        return await base.GetAllAsync(page, pageSize, filter, q => q.OrderBy(x => x.TenCongTy));
    }

    public async Task<NhaThau> CreateAsync(CreateNhaThauDto dto)
    {
        var exists = await _set.AnyAsync(n => n.MaSoThue == dto.MaSoThue);
        if (exists)
            throw new ConflictException("Mã số thuế đã tồn tại");

        if (dto.NguoiDungId.HasValue)
        {
            var userExists = await _db.NguoiDungs.AnyAsync(u => u.Id == dto.NguoiDungId.Value);
            if (!userExists)
                throw new NotFoundException($"Không tìm thấy người dùng với Id = {dto.NguoiDungId}");
        }

        var entity = new NhaThau
        {
            MaSoThue = dto.MaSoThue,
            TenCongTy = InputSanitizer.Sanitize(dto.TenCongTy),
            DiaChi = dto.DiaChi != null ? InputSanitizer.Sanitize(dto.DiaChi) : null,
            NguoiDaiDien = dto.NguoiDaiDien != null ? InputSanitizer.Sanitize(dto.NguoiDaiDien) : null,
            Email = dto.Email,
            SoDienThoai = dto.SoDienThoai,
            TrangThaiHoatDong = dto.TrangThaiHoatDong ?? true,
            NguoiDungId = dto.NguoiDungId
        };

        return await base.CreateAsync(entity);
    }

    public async Task<NhaThau> UpdateAsync(int id, UpdateNhaThauDto dto)
    {
        var existing = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy nhà thầu với Id = {id}");

        if (!string.Equals(existing.MaSoThue, dto.MaSoThue, StringComparison.OrdinalIgnoreCase))
        {
            var exists = await _set.AnyAsync(n => n.MaSoThue == dto.MaSoThue && n.Id != id);
            if (exists)
                throw new ConflictException("Mã số thuế đã tồn tại");
        }

        if (dto.NguoiDungId.HasValue)
        {
            var userExists = await _db.NguoiDungs.AnyAsync(u => u.Id == dto.NguoiDungId.Value);
            if (!userExists)
                throw new NotFoundException($"Không tìm thấy người dùng với Id = {dto.NguoiDungId}");
        }

        existing.MaSoThue = dto.MaSoThue;
        existing.TenCongTy = InputSanitizer.Sanitize(dto.TenCongTy);
        existing.DiaChi = dto.DiaChi != null ? InputSanitizer.Sanitize(dto.DiaChi) : null;
        existing.NguoiDaiDien = dto.NguoiDaiDien != null ? InputSanitizer.Sanitize(dto.NguoiDaiDien) : null;
        existing.Email = dto.Email;
        existing.SoDienThoai = dto.SoDienThoai;
        existing.TrangThaiHoatDong = dto.TrangThaiHoatDong;
        existing.NguoiDungId = dto.NguoiDungId;

        await _db.SaveChangesAsync();
        return existing;
    }

    public override async Task DeleteAsync(int id)
    {
        var existing = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy nhà thầu với Id = {id}");

        if (existing.TrangThaiHoatDong)
            throw new BadRequestException("Không thể xoá nhà thầu đang hoạt động");

        _set.Remove(existing);
        await _db.SaveChangesAsync();
    }
}
