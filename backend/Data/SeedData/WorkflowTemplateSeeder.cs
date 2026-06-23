using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Data.SeedData;

public static class WorkflowTemplateSeeder
{
    // (MaHinhThuc, TenHinhThuc) — đúng 11 loại frontend
    private static readonly (string Ma, string Ten)[] HinhThucs =
    [
        ("CDT_TQD_LCNT",         "Chỉ định thầu tự quyết định LCNT"),
        ("CDT_RG",               "Chỉ định thầu rút gọn"),
        ("CDT_TQD",              "Chỉ định thầu tự quyết định"),
        ("CDT_TT",               "Chỉ định thầu thông thường"),
        ("CHCT",                 "Chào hàng cạnh tranh"),
        ("DTRR",                 "Đấu thầu rộng rãi"),
        ("MSTT",                 "Mua sắm trực tiếp"),
        ("CGTT_TT",              "Chào giá trực tuyến thông thường"),
        ("CGTT_RG",              "Chào giá trực tuyến rút gọn"),
        ("MST",                  "Mua sắm trực tuyến"),
        ("DAT_HANG",             "Đặt hàng"),
    ];

    // (MaWorkflow, TenWorkflow, MaHinhThuc, steps[])
    // steps: (MaBuoc, TenBuoc, LoaiBuoc, TenVaiTro, SoNgay, ChoPhepTuChoi, ChoPhepBoQua)
    private static readonly (
        string MaWorkflow, string TenWorkflow, string MaHinhThuc,
        (string MaBuoc, string TenBuoc, string LoaiBuoc, string TenVaiTro, int SoNgay, bool ChoPhepTuChoi, bool ChoPhepBoQua)[] Steps
    )[] Templates =
    [
        (
            "WF_CDT_TQD_LCNT", "Quy trình chỉ định thầu tự quyết định LCNT", "CDT_TQD_LCNT",
            [
                ("DXMS", "Đề xuất mua sắm", "THUC_HIEN", "KHOA_PHONG", 2, false, false),
                ("TT_CT", "Tờ trình chủ trương", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("LAP_HSMT", "Lập hồ sơ mời thầu", "THUC_HIEN", "PHONG_QLDT", 5, false, false),
                ("PD_HSMT", "Phê duyệt hồ sơ mời thầu", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("QD_CDNT", "Quyết định chỉ định nhà thầu", "PHE_DUYET", "VIEN_TRUONG", 3, true, false),
            ]
        ),
        (
            "WF_CDT_RG", "Quy trình chỉ định thầu rút gọn", "CDT_RG",
            [
                ("DXMS", "Đề xuất mua sắm", "THUC_HIEN", "KHOA_PHONG", 2, false, false),
                ("TT_CT", "Tờ trình chủ trương", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("DT_YC_BG", "Đăng tải yêu cầu báo giá", "THUC_HIEN", "PHONG_QLDT", 1, false, false),
                ("BB_KT_BG", "Biên bản kiểm tra báo giá", "KIEM_TRA", "PHONG_QLDT", 2, true, false),
                ("TT_PD_DT", "Tờ trình phê duyệt dự toán", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("QD_PD_DT", "Quyết định phê duyệt dự toán", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("QD_CDNT", "Quyết định chỉ định nhà thầu", "PHE_DUYET", "VIEN_TRUONG", 3, true, false),
            ]
        ),
        (
            "WF_CDT_TQD", "Quy trình chỉ định thầu tự quyết định", "CDT_TQD",
            [
                ("DXMS", "Đề xuất mua sắm", "THUC_HIEN", "KHOA_PHONG", 2, false, false),
                ("TT_CT", "Tờ trình chủ trương", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("LAP_HSMT", "Lập hồ sơ mời thầu", "THUC_HIEN", "PHONG_QLDT", 5, false, false),
                ("PD_HSMT", "Phê duyệt hồ sơ mời thầu", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("QD_CDNT", "Quyết định chỉ định nhà thầu", "PHE_DUYET", "VIEN_TRUONG", 3, true, false),
            ]
        ),
        (
            "WF_CDT_TT", "Quy trình chỉ định thầu thông thường", "CDT_TT",
            [
                ("DXMS", "Đề xuất mua sắm", "THUC_HIEN", "KHOA_PHONG", 2, false, false),
                ("TT_CT", "Tờ trình chủ trương", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("LAP_HSYC", "Lập hồ sơ yêu cầu", "THUC_HIEN", "PHONG_QLDT", 5, false, false),
                ("TD_HSYC", "Thẩm định hồ sơ yêu cầu", "KIEM_TRA", "PHONG_QLDT", 3, true, false),
                ("PD_HSYC", "Phê duyệt hồ sơ yêu cầu", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("DG_HSDX", "Đánh giá hồ sơ đề xuất", "KIEM_TRA", "PHONG_QLDT", 5, true, false),
                ("PD_KQ", "Phê duyệt kết quả lựa chọn NT", "PHE_DUYET", "VIEN_TRUONG", 3, true, false),
            ]
        ),
        (
            "WF_CHCT", "Quy trình chào hàng cạnh tranh", "CHCT",
            [
                ("DXMS", "Đề xuất mua sắm", "THUC_HIEN", "KHOA_PHONG", 2, false, false),
                ("TT_CT", "Tờ trình chủ trương", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("DT_YC_BG", "Đăng tải yêu cầu báo giá", "THUC_HIEN", "PHONG_QLDT", 1, false, false),
                ("BB_KT_BG", "Biên bản kiểm tra báo giá", "KIEM_TRA", "PHONG_QLDT", 2, true, false),
                ("TT_PD_DT", "Tờ trình phê duyệt dự toán", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("QD_PD_DT", "Quyết định phê duyệt dự toán", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("TT_KH_LCNT", "Tờ trình kế hoạch LCNT", "THUC_HIEN", "PHONG_QLDT", 3, false, false),
                ("QD_KH_LCNT", "Quyết định kế hoạch LCNT", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("DT_KH_LCNT", "Đăng tải kế hoạch LCNT", "THUC_HIEN", "PHONG_QLDT", 1, false, false),
                ("PH_HSMT", "Phát hành hồ sơ mời thầu", "THUC_HIEN", "PHONG_QLDT", 3, false, false),
                ("NOP_HSDT", "Nộp hồ sơ dự thầu", "THUC_HIEN", "KHOA_PHONG", 5, false, false),
                ("MT_DG_HSDT", "Mở thầu và đánh giá HSDT", "KIEM_TRA", "PHONG_QLDT", 5, true, false),
                ("TRINH_KQ", "Trình kết quả lựa chọn NT", "THUC_HIEN", "PHONG_QLDT", 2, false, false),
                ("QD_PD_KQ", "Quyết định phê duyệt kết quả", "PHE_DUYET", "VIEN_TRUONG", 3, true, false),
            ]
        ),
        (
            "WF_DTRR", "Quy trình đấu thầu rộng rãi", "DTRR",
            [
                ("DXMS", "Đề xuất mua sắm", "THUC_HIEN", "KHOA_PHONG", 3, false, false),
                ("TT_CT", "Tờ trình chủ trương", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("TT_PD_DT", "Tờ trình phê duyệt dự toán", "THUC_HIEN", "BCN_KHOA_PHONG", 3, false, false),
                ("QD_PD_DT", "Quyết định phê duyệt dự toán", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("TT_KH_LCNT", "Tờ trình kế hoạch LCNT", "THUC_HIEN", "PHONG_QLDT", 3, false, false),
                ("QD_KH_LCNT", "Quyết định kế hoạch LCNT", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("DT_KH_LCNT", "Đăng tải kế hoạch LCNT", "THUC_HIEN", "PHONG_QLDT", 1, false, false),
                ("LP_HSMT", "Lập hồ sơ mời thầu", "THUC_HIEN", "PHONG_QLDT", 7, false, false),
                ("PD_HSMT", "Phê duyệt HSMT", "PHE_DUYET", "VIEN_TRUONG", 3, true, false),
                ("DT_MT", "Đăng tải mời thầu", "THUC_HIEN", "PHONG_QLDT", 2, false, false),
                ("NOP_HSDT", "Nộp HSDT", "THUC_HIEN", "KHOA_PHONG", 10, false, false),
                ("MO_THAU", "Mở thầu", "THUC_HIEN", "PHONG_QLDT", 1, false, false),
                ("DG_HSDT", "Đánh giá HSDT", "KIEM_TRA", "PHONG_QLDT", 10, true, false),
                ("TRINH_KQ", "Trình kết quả lựa chọn NT", "THUC_HIEN", "PHONG_QLDT", 2, false, false),
                ("QD_PD_KQ", "Quyết định phê duyệt kết quả", "PHE_DUYET", "VIEN_TRUONG", 3, true, false),
                ("DT_KQ_LCNT", "Đăng tải kết quả LCNT", "THUC_HIEN", "PHONG_QLDT", 1, false, false),
                ("KY_HD", "Ký kết hợp đồng", "THUC_HIEN", "PHONG_QLDT", 3, false, false),
            ]
        ),
        (
            "WF_MSTT", "Quy trình mua sắm trực tiếp", "MSTT",
            [
                ("DXMS", "Đề xuất mua sắm", "THUC_HIEN", "KHOA_PHONG", 2, false, false),
                ("TT_CT", "Tờ trình chủ trương", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("PD_DT", "Phê duyệt dự toán", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("TT_NCC", "Thương thảo nhà cung cấp", "THUC_HIEN", "PHONG_QLDT", 3, false, false),
                ("PD_KQ_MSTT", "Phê duyệt kết quả mua sắm trực tiếp", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("KY_HD", "Ký kết hợp đồng", "THUC_HIEN", "PHONG_QLDT", 2, false, false),
            ]
        ),
        (
            "WF_CGTT_TT", "Quy trình chào giá trực tuyến thông thường", "CGTT_TT",
            [
                ("DXMS", "Đề xuất mua sắm", "THUC_HIEN", "KHOA_PHONG", 2, false, false),
                ("TT_CT", "Tờ trình chủ trương", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("DT_CGTT", "Đăng tải chào giá trực tuyến", "THUC_HIEN", "PHONG_QLDT", 1, false, false),
                ("TN_BG", "Tiếp nhận báo giá", "THUC_HIEN", "PHONG_QLDT", 3, false, false),
                ("DG_BG", "Đánh giá báo giá", "KIEM_TRA", "PHONG_QLDT", 3, true, false),
                ("PD_KQ_CG", "Phê duyệt kết quả chào giá", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("KY_HD", "Ký kết hợp đồng", "THUC_HIEN", "PHONG_QLDT", 2, false, false),
            ]
        ),
        (
            "WF_CGTT_RG", "Quy trình chào giá trực tuyến rút gọn", "CGTT_RG",
            [
                ("DXMS", "Đề xuất mua sắm", "THUC_HIEN", "KHOA_PHONG", 2, false, false),
                ("DT_CGTT", "Đăng tải chào giá trực tuyến", "THUC_HIEN", "PHONG_QLDT", 1, false, false),
                ("TN_BG", "Tiếp nhận báo giá", "THUC_HIEN", "PHONG_QLDT", 2, false, false),
                ("PD_KQ_CG", "Phê duyệt kết quả chào giá", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("KY_HD", "Ký kết hợp đồng", "THUC_HIEN", "PHONG_QLDT", 2, false, false),
            ]
        ),
        (
            "WF_MST", "Quy trình mua sắm trực tuyến", "MST",
            [
                ("DXMS", "Đề xuất mua sắm", "THUC_HIEN", "KHOA_PHONG", 2, false, false),
                ("TT_CT", "Tờ trình chủ trương", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("CH_HH", "Chọn hàng hóa trên hệ thống", "THUC_HIEN", "PHONG_QLDT", 2, false, false),
                ("PD_DH", "Phê duyệt đơn hàng", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("HT_MS", "Hoàn tất mua sắm", "THUC_HIEN", "PHONG_QLDT", 2, false, false),
            ]
        ),
        (
            "WF_DH", "Quy trình đặt hàng", "DAT_HANG",
            [
                ("DXMS", "Đề xuất mua sắm", "THUC_HIEN", "KHOA_PHONG", 2, false, false),
                ("TT_CT", "Tờ trình chủ trương", "THUC_HIEN", "BCN_KHOA_PHONG", 2, false, false),
                ("LP_PDH", "Lập phiếu đặt hàng", "THUC_HIEN", "PHONG_QLDT", 2, false, false),
                ("PD_DH", "Phê duyệt đặt hàng", "PHE_DUYET", "VIEN_TRUONG", 2, true, false),
                ("TD_TH", "Theo dõi thực hiện", "THUC_HIEN", "KHOA_PHONG", 5, false, false),
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

            var hinhThucTen = HinhThucs.FirstOrDefault(h => h.Ma == maHinhThuc).Ten;

            var wf = await context.Workflows.FirstOrDefaultAsync(w => w.MaWorkflow == maWorkflow);
            if (wf == null)
            {
                wf = new Workflow
                {
                    MaWorkflow = maWorkflow,
                    TenWorkflow = tenWorkflow,
                    HinhThucId = hinhThucId,
                    LoaiHinhDauThau = hinhThucTen,
                    LaQuyTrinhChuan = true,
                    TrangThaiHoatDong = true
                };
                context.Workflows.Add(wf);
                await context.SaveChangesAsync();
                logger.LogInformation("Seed: Tạo workflow [{Ma}] loại [{Loai}]", maWorkflow, hinhThucTen);
            }
            else
            {
                // Update existing: ensure flags are set
                wf.LoaiHinhDauThau ??= hinhThucTen;
                wf.LaQuyTrinhChuan = true;
                await context.SaveChangesAsync();
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
