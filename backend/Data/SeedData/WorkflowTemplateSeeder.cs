using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Data.SeedData;

public static class WorkflowTemplateSeeder
{
    // (MaHinhThuc, TenHinhThuc)
    private static readonly (string Ma, string Ten)[] HinhThucs =
    [
        ("CHI_DINH_THAU",        "Chỉ định thầu"),
        ("DAU_THAU_RONG_RAI",    "Đấu thầu rộng rãi"),
        ("DAU_THAU_HAN_CHE",     "Đấu thầu hạn chế"),
        ("CHAO_HANG_CANH_TRANH", "Chào hàng cạnh tranh"),
        ("MUA_SAM_TRUC_TIEP",    "Mua sắm trực tiếp"),
        ("TU_THUC_HIEN",         "Tự thực hiện"),
    ];

    // (MaWorkflow, TenWorkflow, MaHinhThuc, steps[])
    // steps: (MaBuoc, TenBuoc, LoaiBuoc, TenVaiTro, SoNgay, ChoPhepTuChoi, ChoPhepBoQua)
    // SoNgay áp dụng cho cả LAP_HO_SO và KY_DUYET trong seed (có thể tinh chỉnh sau)
    private static readonly (
        string MaWorkflow, string TenWorkflow, string MaHinhThuc,
        (string MaBuoc, string TenBuoc, string LoaiBuoc, string TenVaiTro, int SoNgay, bool ChoPhepTuChoi, bool ChoPhepBoQua)[] Steps
    )[] Templates =
    [
        (
            "WF_CHI_DINH_THAU", "Quy trình chỉ định thầu", "CHI_DINH_THAU",
            [
                ("LAP_DE_XUAT",      "Lập đề xuất",      "THUC_HIEN", "KHOA_PHONG",     2, false, false),
                ("DUYET_KHOA_PHONG", "Duyệt khoa/phòng", "PHE_DUYET", "BCN_KHOA_PHONG", 2, true,  false),
                ("KIEM_TRA_QLDT",    "Kiểm tra QLĐT",    "KIEM_TRA",  "PHONG_QLDT",     3, true,  false),
                ("PHE_DUYET_BGD",    "Phê duyệt BGĐ",    "PHE_DUYET", "VIEN_TRUONG",    5, true,  false),
                ("KY_HOP_DONG",      "Ký hợp đồng",      "THUC_HIEN", "PHONG_QLDT",     3, false, false),
            ]
        ),
        (
            "WF_DAU_THAU_RONG_RAI", "Quy trình đấu thầu rộng rãi", "DAU_THAU_RONG_RAI",
            [
                ("LAP_DE_XUAT",        "Lập đề xuất",        "THUC_HIEN", "KHOA_PHONG",     3, false, false),
                ("DUYET_KHOA_PHONG",   "Duyệt khoa/phòng",   "PHE_DUYET", "BCN_KHOA_PHONG", 3, true,  false),
                ("KIEM_TRA_QLDT",      "Kiểm tra QLĐT",      "KIEM_TRA",  "PHONG_QLDT",     5, true,  false),
                ("PHE_DUYET_KE_HOACH", "Phê duyệt kế hoạch", "PHE_DUYET", "VIEN_TRUONG",    7, true,  false),
                ("PHAT_HANH_HSMT",     "Phát hành HSMT",     "THUC_HIEN", "PHONG_QLDT",     5, false, false),
                ("DANH_GIA_HSDT",      "Đánh giá HSDT",      "KIEM_TRA",  "PHONG_QLDT",    10, true,  false),
                ("PHE_DUYET_KQ",       "Phê duyệt kết quả",  "PHE_DUYET", "VIEN_TRUONG",    5, true,  false),
                ("KY_HOP_DONG",        "Ký hợp đồng",        "THUC_HIEN", "PHONG_QLDT",     3, false, false),
            ]
        ),
        (
            "WF_DAU_THAU_HAN_CHE", "Quy trình đấu thầu hạn chế", "DAU_THAU_HAN_CHE",
            [
                ("LAP_DE_XUAT",        "Lập đề xuất",        "THUC_HIEN", "KHOA_PHONG",     3, false, false),
                ("DUYET_KHOA_PHONG",   "Duyệt khoa/phòng",   "PHE_DUYET", "BCN_KHOA_PHONG", 2, true,  false),
                ("KIEM_TRA_QLDT",      "Kiểm tra QLĐT",      "KIEM_TRA",  "PHONG_QLDT",     5, true,  false),
                ("PHE_DUYET_KE_HOACH", "Phê duyệt kế hoạch", "PHE_DUYET", "VIEN_TRUONG",    5, true,  false),
                ("PHAT_HANH_HSMT",     "Phát hành HSMT",     "THUC_HIEN", "PHONG_QLDT",     3, false, false),
                ("DANH_GIA_HSDT",      "Đánh giá HSDT",      "KIEM_TRA",  "PHONG_QLDT",     7, true,  false),
                ("PHE_DUYET_KQ",       "Phê duyệt kết quả",  "PHE_DUYET", "VIEN_TRUONG",    5, true,  false),
                ("KY_HOP_DONG",        "Ký hợp đồng",        "THUC_HIEN", "PHONG_QLDT",     3, false, false),
            ]
        ),
        (
            "WF_CHAO_HANG_CANH_TRANH", "Quy trình chào hàng cạnh tranh", "CHAO_HANG_CANH_TRANH",
            [
                ("LAP_DE_XUAT",        "Lập đề xuất",                "THUC_HIEN", "KHOA_PHONG",     2, false, false),
                ("DUYET_KHOA_PHONG",   "Duyệt khoa/phòng",           "PHE_DUYET", "BCN_KHOA_PHONG", 2, true,  false),
                ("KIEM_TRA_QLDT",      "Kiểm tra QLĐT",              "KIEM_TRA",  "PHONG_QLDT",     3, true,  false),
                ("PHE_DUYET_BGD",      "Phê duyệt BGĐ",              "PHE_DUYET", "VIEN_TRUONG",    3, true,  false),
                ("PHAT_HANH_YC_BG",    "Phát hành yêu cầu báo giá",  "THUC_HIEN", "PHONG_QLDT",     3, false, false),
                ("DANH_GIA_BAO_GIA",   "Đánh giá báo giá",           "KIEM_TRA",  "PHONG_QLDT",     5, true,  false),
                ("KY_HOP_DONG",        "Ký hợp đồng",                "THUC_HIEN", "PHONG_QLDT",     3, false, false),
            ]
        ),
        (
            "WF_MUA_SAM_TRUC_TIEP", "Quy trình mua sắm trực tiếp", "MUA_SAM_TRUC_TIEP",
            [
                ("LAP_DE_XUAT",      "Lập đề xuất",      "THUC_HIEN", "KHOA_PHONG",     1, false, false),
                ("DUYET_KHOA_PHONG", "Duyệt khoa/phòng", "PHE_DUYET", "BCN_KHOA_PHONG", 2, true,  false),
                ("KIEM_TRA_QLDT",    "Kiểm tra QLĐT",    "KIEM_TRA",  "PHONG_QLDT",     2, true,  false),
                ("PHE_DUYET_BGD",    "Phê duyệt BGĐ",    "PHE_DUYET", "VIEN_TRUONG",    3, true,  false),
                ("KY_HOP_DONG",      "Ký hợp đồng",      "THUC_HIEN", "PHONG_QLDT",     2, false, false),
            ]
        ),
        (
            "WF_TU_THUC_HIEN", "Quy trình tự thực hiện", "TU_THUC_HIEN",
            [
                ("LAP_DE_XUAT",       "Lập đề xuất",          "THUC_HIEN", "KHOA_PHONG",     2, false, false),
                ("DUYET_KHOA_PHONG",  "Duyệt khoa/phòng",     "PHE_DUYET", "BCN_KHOA_PHONG", 2, true,  false),
                ("KIEM_TRA_QLDT",     "Kiểm tra QLĐT",        "KIEM_TRA",  "PHONG_QLDT",     3, true,  false),
                ("PHE_DUYET_BGD",     "Phê duyệt BGĐ",        "PHE_DUYET", "VIEN_TRUONG",    3, true,  false),
                ("XAC_NHAN_HOAN_THANH", "Xác nhận hoàn thành","THUC_HIEN", "PHONG_QLDT",     5, false, false),
            ]
        ),
    ];

    public static async Task SeedAsync(AppDbContext context, ILogger logger)
    {
        var vaiTroMap = await context.VaiTros
            .Where(v => !v.DaXoa)
            .ToDictionaryAsync(v => v.TenVaiTro, v => v.Id);

        // 1. Seed HinhThucDauThau
        foreach (var (ma, ten) in HinhThucs)
        {
            var existing = await context.HinhThucDauThaus.FirstOrDefaultAsync(h => h.MaHinhThuc == ma);
            if (existing == null)
            {
                context.HinhThucDauThaus.Add(new HinhThucDauThau
                {
                    MaHinhThuc = ma,
                    TenHinhThuc = ten,
                    TrangThaiHoatDong = true
                });
                logger.LogInformation("Seed: Tạo hình thức đấu thầu [{Ma}]", ma);
            }
        }
        await context.SaveChangesAsync();

        // Cache để tra cứu nhanh
        var hinhThucMap = await context.HinhThucDauThaus
            .ToDictionaryAsync(h => h.MaHinhThuc, h => h.Id);

        // 2. Seed Workflow + BuocWorkflow
        foreach (var (maWorkflow, tenWorkflow, maHinhThuc, steps) in Templates)
        {
            if (!hinhThucMap.TryGetValue(maHinhThuc, out var hinhThucId))
            {
                logger.LogWarning("Seed: Không tìm thấy hình thức [{Ma}] cho workflow [{Wf}]", maHinhThuc, maWorkflow);
                continue;
            }

            var wf = await context.Workflows.FirstOrDefaultAsync(w => w.MaWorkflow == maWorkflow);
            if (wf == null)
            {
                wf = new Workflow
                {
                    MaWorkflow = maWorkflow,
                    TenWorkflow = tenWorkflow,
                    HinhThucId = hinhThucId,
                    TrangThaiHoatDong = true
                };
                context.Workflows.Add(wf);
                await context.SaveChangesAsync();
                logger.LogInformation("Seed: Tạo workflow [{Ma}]", maWorkflow);
            }

            // 3. Seed BuocWorkflow
            var existingBuocs = await context.BuocWorkflows
                .Where(b => b.WorkflowId == wf.Id)
                .ToListAsync();

            var templateMaBuocs = steps.Select(s => s.MaBuoc).ToHashSet();

            // Xóa bước không thuộc template (test data dư)
            var extraBuocs = existingBuocs.Where(b => !templateMaBuocs.Contains(b.MaBuoc)).ToList();
            if (extraBuocs.Count > 0)
            {
                var extraIds = extraBuocs.Select(b => b.Id).ToList();
                var extraTransitions = await context.ChuyenTiepWorkflows
                    .Where(t => extraIds.Contains(t.TuBuocId) || extraIds.Contains(t.DenBuocId))
                    .ToListAsync();
                context.ChuyenTiepWorkflows.RemoveRange(extraTransitions);
                context.BuocWorkflows.RemoveRange(extraBuocs);
                await context.SaveChangesAsync();
                foreach (var b in extraBuocs)
                    logger.LogInformation("Seed: Xóa bước dư [{Ma}] khỏi workflow [{Wf}]", b.MaBuoc, maWorkflow);
            }

            var buocList = new List<BuocWorkflow>();
            for (int i = 0; i < steps.Length; i++)
            {
                var (maBuoc, tenBuoc, loaiBuoc, tenVaiTro, sla, choPhepTuChoi, choPhepBoQua) = steps[i];

                if (!vaiTroMap.TryGetValue(tenVaiTro, out var vaiTroId))
                {
                    logger.LogWarning("Seed: Không tìm thấy vai trò [{VT}] cho bước [{Buoc}]", tenVaiTro, maBuoc);
                    continue;
                }

                var buoc = existingBuocs.FirstOrDefault(b => b.MaBuoc == maBuoc);
                if (buoc == null)
                {
                    buoc = new BuocWorkflow
                    {
                        WorkflowId = wf.Id,
                        MaBuoc = maBuoc,
                        TenBuoc = tenBuoc,
                        LoaiBuoc = loaiBuoc,
                        VaiTroXuLyHoSoId = vaiTroId,
                        SoNgayLapHoSo = sla,
                        SoNgayXuLy = sla,
                        LoaiHan = "CANH_BAO",
                        ChoPhepTuChoi = choPhepTuChoi,
                        ChoPhepBoQua = choPhepBoQua,
                    };
                    context.BuocWorkflows.Add(buoc);
                }
                buocList.Add(buoc);
            }
            await context.SaveChangesAsync();

            // 4. Seed ChuyenTiepWorkflow (APPROVE transitions: step i → step i+1)
            var savedBuocs = await context.BuocWorkflows
                .Where(b => b.WorkflowId == wf.Id)
                .ToListAsync();

            var orderedBuocs = steps
                .Select(s => savedBuocs.FirstOrDefault(b => b.MaBuoc == s.MaBuoc))
                .Where(b => b != null)
                .ToList();

            for (int i = 0; i < orderedBuocs.Count - 1; i++)
            {
                var tuBuoc = orderedBuocs[i]!;
                var denBuoc = orderedBuocs[i + 1]!;

                var existingTransition = await context.ChuyenTiepWorkflows
                    .AnyAsync(t => t.TuBuocId == tuBuoc.Id && t.DenBuocId == denBuoc.Id && t.HanhDong == "APPROVE");

                if (!existingTransition)
                {
                    context.ChuyenTiepWorkflows.Add(new ChuyenTiepWorkflow
                    {
                        TuBuocId = tuBuoc.Id,
                        DenBuocId = denBuoc.Id,
                        HanhDong = "APPROVE"
                    });
                }
            }
            await context.SaveChangesAsync();
        }
    }
}
