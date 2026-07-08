namespace QLQTDT.Api.Tests;

public class SeedDataContractTests
{
    [Fact]
    public void DbInitializer_SeedsProcurementActorsAndUnitsIdempotently()
    {
        var source = ReadBackendSource("Data/DbInitializer.cs");

        Assert.Contains("(\"TU_VAN_LCNT\", \"Tư vấn LCNT\"", source);
        Assert.Contains("(\"TO_CHUYEN_GIA\", \"Tổ chuyên gia\"", source);
        Assert.Contains("(\"TO_THAM_DINH\", \"Tổ thẩm định\"", source);
        Assert.Contains("(\"TO_KIEM_TRA_GIA\", \"Tổ kiểm tra giá\"", source);

        Assert.Contains("k.MaKhoaPhong == maKhoaPhong || k.TenKhoaPhong == tenKhoaPhong", source);
        Assert.Contains("v.MaVaiTro == maVaiTro || v.TenVaiTro == tenVaiTro", source);
        Assert.DoesNotContain("if (await context.KhoaPhongs.AnyAsync())", source);
        Assert.Contains("FirstOrDefaultAsync(k => k.MaKhoaPhong == \"KTTH\")", source);
    }

    [Fact]
    public void Program_SeedsInDevelopmentEvenWhenStartupSeedFlagIsOff()
    {
        var source = ReadBackendSource("Program.cs");

        Assert.Contains("builder.Environment.IsDevelopment()", source);
        Assert.Contains("RUN_STARTUP_SEED", source);
    }

    [Fact]
    public void Migration_BackfillsProcurementLookupsIdempotently()
    {
        var source = ReadBackendSource("Migrations/20260708102000_BackfillProcurementLookupEntries.cs");

        Assert.Contains("INSERT INTO KhoaPhong", source);
        Assert.Contains("INSERT INTO VaiTro", source);
        Assert.Contains("TU_VAN_LCNT", source);
        Assert.Contains("TO_CHUYEN_GIA", source);
        Assert.Contains("TO_THAM_DINH", source);
        Assert.Contains("TO_KIEM_TRA_GIA", source);
    }

    [Fact]
    public void StepLibrary_UsesDynamicPurchasingPlaceholdersOnly()
    {
        var source = ReadFrontendSource("src/pages/LapQuyTrinh/stepLibrary.ts");

        Assert.Contains("DYNAMIC_PURCHASING_DEPARTMENT_LABEL", source);
        Assert.Contains("DYNAMIC_PURCHASING_ROLE_LABEL", source);
        Assert.Contains("donViPhuTrachDisplay: DYNAMIC_PURCHASING_DEPARTMENT_LABEL", source);
        Assert.Contains("vaiTroXuLyDisplay: DYNAMIC_PURCHASING_ROLE_LABEL", source);
        Assert.DoesNotContain("donViPhuTrach: \"K/P mua sắm\"", source);
        Assert.DoesNotContain("vaiTroXuLy: \"Nhân viên K/P mua sắm\"", source);
    }

    [Fact]
    public void StepFormModal_DoesNotSeedPurchasingPlaceholdersAsLookupOptions()
    {
        var source = ReadFrontendSource("src/pages/LapQuyTrinh/components/StepFormModal.tsx");

        Assert.DoesNotContain("\"K/P mua sắm\", \"K/P sử dụng\"", source);
        Assert.DoesNotContain("\"Nhân viên K/P mua sắm\", \"Nhân viên K/P sử dụng\"", source);
    }

    private static string ReadBackendSource(string relativePath)
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var backendRoot = Path.Combine(current.FullName, "backend");
            if (Directory.Exists(backendRoot))
                return File.ReadAllText(Path.Combine(backendRoot, relativePath));

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate backend source root.");
    }

    private static string ReadFrontendSource(string relativePath)
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var frontendRoot = Path.Combine(current.FullName, "frontend");
            if (Directory.Exists(frontendRoot))
                return File.ReadAllText(Path.Combine(frontendRoot, relativePath));

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate frontend source root.");
    }
}
