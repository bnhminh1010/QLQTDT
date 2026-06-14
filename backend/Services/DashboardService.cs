using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Dashboard;
using QLQTDT.Api.Models.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace QLQTDT.Api.Services;

public class DashboardService : IDashboardService
{
    private const string ExcelContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    private const string PdfContentType = "application/pdf";

    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync()
    {
        var activeGoiThau = _db.GoiThaus.AsNoTracking().Where(g => g.TrangThaiHoatDong);

        var trangThai = await activeGoiThau
            .GroupBy(g => g.TrangThai)
            .Select(g => new { TrangThai = g.Key, SoLuong = g.Count() })
            .ToDictionaryAsync(x => x.TrangThai, x => x.SoLuong);

        foreach (var status in GoiThauTrangThai.All)
            trangThai.TryAdd(status, 0);

        var tongGiaTriDuToan = await activeGoiThau.SumAsync(g => g.NganSach ?? 0);
        var tongGiaTrungThau = await _db.HoSoDuThaus
            .AsNoTracking()
            .Where(h => h.TrangThai == HoSoDuThauTrangThai.TRUNG_THAU)
            .SumAsync(h => h.GiaTrungThau ?? h.GiaDuThau);

        var tiLeTietKiem = tongGiaTriDuToan > 0
            ? Math.Round((tongGiaTriDuToan - tongGiaTrungThau) / tongGiaTriDuToan * 100, 2)
            : 0;

        return new DashboardSummaryDto
        {
            TongGoiThau = await activeGoiThau.CountAsync(),
            TrangThai = trangThai,
            TongGiaTriDuToan = tongGiaTriDuToan,
            TongGiaTrungThau = tongGiaTrungThau,
            TiLeTietKiem = tiLeTietKiem
        };
    }

    public async Task<DashboardStatisticsDto> GetStatisticsAsync(int? nam, int? quy)
    {
        var year = nam ?? DateTime.UtcNow.Year;
        if (year < 2000 || year > 9999)
            throw new BadRequestException("nam khong hop le.");

        if (quy is < 1 or > 4)
            throw new BadRequestException("quy phai nam trong khoang 1-4.");

        var fromMonth = quy.HasValue ? (quy.Value - 1) * 3 + 1 : 1;
        var toMonth = quy.HasValue ? fromMonth + 2 : 12;
        var fromDate = new DateTime(year, fromMonth, 1);
        var toDate = new DateTime(year, toMonth, DateTime.DaysInMonth(year, toMonth), 23, 59, 59, 999);

        var query = _db.GoiThaus
            .AsNoTracking()
            .Where(g => g.TrangThaiHoatDong && g.NgayTao >= fromDate && g.NgayTao <= toDate);

        var monthRows = await query
            .GroupBy(g => g.NgayTao.Month)
            .Select(g => new DashboardMonthlyStatisticDto
            {
                Thang = g.Key,
                SoLuong = g.Count(),
                TongGiaTri = g.Sum(x => x.NganSach ?? 0)
            })
            .ToListAsync();

        var monthlyByMonth = monthRows.ToDictionary(x => x.Thang);
        var theoThang = Enumerable.Range(fromMonth, toMonth - fromMonth + 1)
            .Select(month => monthlyByMonth.TryGetValue(month, out var value)
                ? value
                : new DashboardMonthlyStatisticDto { Thang = month })
            .ToList();

        var theoKhoaPhongQuery =
            from g in query
            join k in _db.KhoaPhongs.AsNoTracking() on g.KhoaPhongId equals k.Id into khoaPhongGroup
            from k in khoaPhongGroup.DefaultIfEmpty()
            group g by k == null ? "Chua xac dinh" : k.TenKhoaPhong into grouped
            select new DashboardDepartmentStatisticDto
            {
                KhoaPhong = grouped.Key,
                SoLuong = grouped.Count(),
                TongGiaTri = grouped.Sum(x => x.NganSach ?? 0)
            };

        var theoKhoaPhong = await theoKhoaPhongQuery
            .OrderByDescending(x => x.SoLuong)
            .ToListAsync();

        var methodRowsQuery =
            from g in query
            join h in _db.HinhThucDauThaus.AsNoTracking() on g.HinhThucId equals h.Id into hinhThucGroup
            from h in hinhThucGroup.DefaultIfEmpty()
            group g by h == null ? "Chua xac dinh" : h.TenHinhThuc into grouped
            select new
            {
                HinhThuc = grouped.Key,
                SoLuong = grouped.Count()
            };

        var methodRows = await methodRowsQuery
            .OrderByDescending(x => x.SoLuong)
            .ToListAsync();

        var total = methodRows.Sum(x => x.SoLuong);
        var theoHinhThuc = methodRows
            .Select(x => new DashboardMethodStatisticDto
            {
                HinhThuc = x.HinhThuc,
                SoLuong = x.SoLuong,
                TiLe = total > 0 ? Math.Round((decimal)x.SoLuong / total * 100, 2) : 0
            })
            .ToList();

        return new DashboardStatisticsDto
        {
            TheoThang = theoThang,
            TheoKhoaPhong = theoKhoaPhong,
            TheoHinhThuc = theoHinhThuc
        };
    }

    public async Task<DashboardPendingDto> GetPendingAsync()
    {
        var trangThai = await _db.HoSoDuThaus
            .AsNoTracking()
            .GroupBy(h => h.TrangThai)
            .Select(g => new { TrangThai = g.Key, SoLuong = g.Count() })
            .ToDictionaryAsync(x => x.TrangThai, x => x.SoLuong);

        foreach (var status in HoSoDuThauTrangThai.All)
            trangThai.TryAdd(status, 0);

        return new DashboardPendingDto
        {
            TongHoSo = trangThai.Values.Sum(),
            TrangThai = trangThai,
            ChuaXuLy = trangThai[HoSoDuThauTrangThai.CHUA_XU_LY],
            DaDuyet = trangThai[HoSoDuThauTrangThai.DA_DUYET],
            BiTuChoi = trangThai[HoSoDuThauTrangThai.BI_TU_CHOI],
            TrungThau = trangThai[HoSoDuThauTrangThai.TRUNG_THAU]
        };
    }

    public async Task<DashboardExportFile> ExportAsync(string? loai, DateTime? tuNgay, DateTime? denNgay)
    {
        if (tuNgay.HasValue && denNgay.HasValue && tuNgay.Value.Date > denNgay.Value.Date)
            throw new BadRequestException("tuNgay khong duoc lon hon denNgay.");

        var normalizedType = string.IsNullOrWhiteSpace(loai) ? "excel" : loai.Trim().ToLowerInvariant();
        var rows = await GetExportRowsAsync(tuNgay, denNgay);
        var suffix = DateTime.UtcNow.ToString("yyyyMMddHHmmss");

        return normalizedType switch
        {
            "excel" or "xlsx" => new DashboardExportFile
            {
                Content = BuildExcel(rows),
                ContentType = ExcelContentType,
                FileName = $"bao_cao_dau_thau_{suffix}.xlsx"
            },
            "pdf" => new DashboardExportFile
            {
                Content = BuildPdf(rows, tuNgay, denNgay),
                ContentType = PdfContentType,
                FileName = $"bao_cao_dau_thau_{suffix}.pdf"
            },
            _ => throw new BadRequestException("loai chi ho tro excel hoac pdf.")
        };
    }

    private async Task<List<DashboardExportRow>> GetExportRowsAsync(DateTime? tuNgay, DateTime? denNgay)
    {
        var query = _db.GoiThaus.AsNoTracking().Where(g => g.TrangThaiHoatDong);

        if (tuNgay.HasValue)
        {
            var from = tuNgay.Value.Date;
            query = query.Where(g => g.NgayTao >= from);
        }

        if (denNgay.HasValue)
        {
            var to = denNgay.Value.Date.AddDays(1);
            query = query.Where(g => g.NgayTao < to);
        }

        var exportQuery =
            from g in query
            join k in _db.KhoaPhongs.AsNoTracking() on g.KhoaPhongId equals k.Id into khoaPhongGroup
            from k in khoaPhongGroup.DefaultIfEmpty()
            join ht in _db.HinhThucDauThaus.AsNoTracking() on g.HinhThucId equals ht.Id into hinhThucGroup
            from ht in hinhThucGroup.DefaultIfEmpty()
            join hs in _db.HoSoDuThaus.AsNoTracking().Where(h => h.TrangThai == HoSoDuThauTrangThai.TRUNG_THAU)
                on g.Id equals hs.GoiThauId into hoSoGroup
            from hs in hoSoGroup.DefaultIfEmpty()
            orderby g.NgayTao descending
            select new DashboardExportRow
            {
                MaGoiThau = g.MaGoiThau,
                TenGoiThau = g.TenGoiThau,
                KhoaPhong = k == null ? "Chua xac dinh" : k.TenKhoaPhong,
                HinhThuc = ht == null ? "Chua xac dinh" : ht.TenHinhThuc,
                TrangThai = g.TrangThai,
                NganSach = g.NganSach ?? 0,
                GiaTrungThau = hs == null ? null : hs.GiaTrungThau ?? hs.GiaDuThau,
                NgayTao = g.NgayTao
            };

        return await exportQuery.ToListAsync();
    }

    private static byte[] BuildExcel(IReadOnlyList<DashboardExportRow> rows)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Bao cao dau thau");

        var headers = new[]
        {
            "Ma goi thau", "Ten goi thau", "Khoa phong", "Hinh thuc", "Trang thai",
            "Ngan sach", "Gia trung thau", "Ngay tao"
        };

        for (var i = 0; i < headers.Length; i++)
            worksheet.Cell(1, i + 1).Value = headers[i];

        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var excelRow = i + 2;
            worksheet.Cell(excelRow, 1).Value = row.MaGoiThau;
            worksheet.Cell(excelRow, 2).Value = row.TenGoiThau;
            worksheet.Cell(excelRow, 3).Value = row.KhoaPhong;
            worksheet.Cell(excelRow, 4).Value = row.HinhThuc;
            worksheet.Cell(excelRow, 5).Value = row.TrangThai;
            worksheet.Cell(excelRow, 6).Value = row.NganSach;
            worksheet.Cell(excelRow, 7).Value = row.GiaTrungThau;
            worksheet.Cell(excelRow, 8).Value = row.NgayTao;
        }

        var usedRange = worksheet.RangeUsed();
        if (usedRange is not null)
        {
            usedRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            usedRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        }

        worksheet.Row(1).Style.Font.Bold = true;
        worksheet.Column(6).Style.NumberFormat.Format = "#,##0";
        worksheet.Column(7).Style.NumberFormat.Format = "#,##0";
        worksheet.Column(8).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";
        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static byte[] BuildPdf(IReadOnlyList<DashboardExportRow> rows, DateTime? tuNgay, DateTime? denNgay)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(20);
                page.DefaultTextStyle(x => x.FontSize(9));
                page.Header().Column(column =>
                {
                    column.Item().Text("Bao cao dau thau").FontSize(18).Bold();
                    column.Item().Text(BuildPeriodText(tuNgay, denNgay)).FontSize(10);
                });
                page.Content().PaddingTop(10).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(75);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.ConstantColumn(80);
                        columns.ConstantColumn(80);
                        columns.ConstantColumn(85);
                    });

                    table.Header(header =>
                    {
                        HeaderCell(header, "Ma goi");
                        HeaderCell(header, "Ten goi thau");
                        HeaderCell(header, "Khoa phong");
                        HeaderCell(header, "Hinh thuc");
                        HeaderCell(header, "Trang thai");
                        HeaderCell(header, "Ngan sach");
                        HeaderCell(header, "Gia trung thau");
                    });

                    foreach (var row in rows)
                    {
                        BodyCell(table, row.MaGoiThau);
                        BodyCell(table, row.TenGoiThau);
                        BodyCell(table, row.KhoaPhong);
                        BodyCell(table, row.HinhThuc);
                        BodyCell(table, row.TrangThai);
                        BodyCell(table, row.NganSach.ToString("#,##0"));
                        BodyCell(table, row.GiaTrungThau?.ToString("#,##0") ?? string.Empty);
                    }
                });
                page.Footer().AlignRight().Text(text =>
                {
                    text.Span("Trang ");
                    text.CurrentPageNumber();
                    text.Span("/");
                    text.TotalPages();
                });
            });
        }).GeneratePdf();
    }

    private static string BuildPeriodText(DateTime? tuNgay, DateTime? denNgay)
    {
        var from = tuNgay?.ToString("dd/MM/yyyy") ?? "...";
        var to = denNgay?.ToString("dd/MM/yyyy") ?? "...";
        return $"Tu ngay {from} den ngay {to}";
    }

    private static void HeaderCell(TableCellDescriptor table, string text)
    {
        table.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text(text).Bold();
    }

    private static void BodyCell(TableDescriptor table, string text)
    {
        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(text);
    }

    private sealed class DashboardExportRow
    {
        public string MaGoiThau { get; set; } = string.Empty;
        public string TenGoiThau { get; set; } = string.Empty;
        public string KhoaPhong { get; set; } = string.Empty;
        public string HinhThuc { get; set; } = string.Empty;
        public string TrangThai { get; set; } = string.Empty;
        public decimal NganSach { get; set; }
        public decimal? GiaTrungThau { get; set; }
        public DateTime NgayTao { get; set; }
    }
}
