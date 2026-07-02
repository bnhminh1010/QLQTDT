namespace QLQTDT.Api.Tests.Security;

public class ProfileChangeRequestWorkflowContractTests
{
    [Fact]
    public void Backend_DefinesDurableProfileChangeRequestEntity()
    {
        var entity = ReadBackendSource("Models/Entities/YeuCauThayDoiThongTinNguoiDung.cs");
        var dbContext = ReadBackendSource("Data/AppDbContext.cs");

        Assert.Contains("class YeuCauThayDoiThongTinNguoiDung", entity);
        Assert.Contains("IdCongKhai", entity);
        Assert.Contains("TrangThai", entity);
        Assert.Contains("GiaTriCuJson", entity);
        Assert.Contains("GiaTriMoiJson", entity);
        Assert.Contains("NguoiXuLyId", entity);
        Assert.Contains("DbSet<YeuCauThayDoiThongTinNguoiDung>", dbContext);
        Assert.Contains("IX_YeuCauThayDoiThongTinNguoiDung_IdCongKhai", dbContext);
    }

    [Fact]
    public void AuthChangeRequest_PersistsRequestAndRejectsEmptyChanges()
    {
        var source = ReadBackendSource("Controllers/AuthController.cs");
        var method = ExtractBetween(
            source,
            "public async Task<IActionResult> SendChangeRequest",
            "/// <summary>Lấy danh sách quyền");

        Assert.Contains("_db.YeuCauThayDoiThongTinNguoiDungs.Add", method);
        Assert.Contains("if (changes.Count == 0)", method);
        Assert.Contains("PROFILE_CHANGE_REQUEST", method);
        Assert.Contains("/nguoi-dung/yeu-cau-thay-doi", method);
        Assert.DoesNotContain("UrlDieuHuong = \"/nguoi-dung\"", method);
    }

    [Fact]
    public void AdminController_ExposesApproveRejectWorkflow()
    {
        var source = ReadBackendSource("Controllers/AdminController.cs");

        Assert.Contains("[HttpGet(\"profile-change-requests\")]", source);
        Assert.Contains("[HttpPost(\"profile-change-requests/{idCongKhai:guid}/approve\")]", source);
        Assert.Contains("[HttpPost(\"profile-change-requests/{idCongKhai:guid}/reject\")]", source);
        Assert.Contains("PROFILE_CHANGE_APPROVED", source);
        Assert.Contains("PROFILE_CHANGE_REJECTED", source);
        Assert.Contains("APPROVE_PROFILE_CHANGE_REQUEST", source);
        Assert.Contains("REJECT_PROFILE_CHANGE_REQUEST", source);
    }

    [Fact]
    public void Frontend_WiresUserRequestAndAdminReviewPanel()
    {
        var adminApi = ReadFrontendSource("services/adminApi.ts");
        var userApi = ReadFrontendSource("services/api.ts");
        var userProfile = ReadFrontendSource("pages/UserProfile/index.tsx");
        var adminUsers = ReadFrontendSource("pages/NguoiDung/index.tsx");

        Assert.Contains("getProfileChangeRequests", adminApi);
        Assert.Contains("approveProfileChangeRequest", adminApi);
        Assert.Contains("rejectProfileChangeRequest", adminApi);
        Assert.Contains("getMyPendingProfileChangeRequest", userApi);
        Assert.Contains("/auth/me/change-request/pending", userApi);
        Assert.Contains("pendingProfileChangeRequest", userProfile);
        Assert.Contains("Yêu cầu đang chờ duyệt", userProfile);
        Assert.Contains("profileRequests", adminUsers);
        Assert.Contains("Yêu cầu thay đổi", adminUsers);
        Assert.Contains("approveProfileChangeRequest", adminUsers);
        Assert.Contains("rejectProfileChangeRequest", adminUsers);
    }

    private static string ReadBackendSource(string relativePath)
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var backendRoot = Path.Combine(current.FullName, "backend");
            if (File.Exists(Path.Combine(backendRoot, "QLQTDT.Api.csproj")))
                return File.ReadAllText(Path.Combine(backendRoot, relativePath));

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate backend project root.");
    }

    private static string ReadFrontendSource(string relativePath)
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var frontendRoot = Path.Combine(current.FullName, "frontend", "src");
            if (Directory.Exists(frontendRoot))
                return File.ReadAllText(Path.Combine(frontendRoot, relativePath));

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate frontend source root.");
    }

    private static string ExtractBetween(string source, string start, string end)
    {
        var startIndex = source.IndexOf(start, StringComparison.Ordinal);
        Assert.True(startIndex >= 0, $"Could not find start marker: {start}");

        var endIndex = source.IndexOf(end, startIndex + start.Length, StringComparison.Ordinal);
        Assert.True(endIndex > startIndex, $"Could not find end marker: {end}");

        return source[startIndex..endIndex];
    }
}
