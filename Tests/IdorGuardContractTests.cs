namespace QLQTDT.Api.Tests.Security;

public class IdorGuardContractTests
{
    [Fact]
    public void HopDong_ListAndDetail_RequireTenderViewScope()
    {
        var source = ReadBackendSource("Services/HopDongService.cs");

        var listMethod = ExtractBetween(
            source,
            "public async Task<PagedResult<HopDongListItemDto>> GetByGoiThauAsync",
            "public async Task<HopDongDetailDto> GetByIdAsync");
        Assert.Contains("await _tenderAccess.EnsureCanViewAsync(currentUserId, goiThauId);", listMethod);

        var detailMethod = ExtractBetween(
            source,
            "public async Task<HopDongDetailDto> GetByIdAsync",
            "private async Task<HopDongDetailDto> BuildDetailDtoAsync");
        Assert.Contains("await _tenderAccess.EnsureCanViewAsync(currentUserId, goiThauId);", detailMethod);
    }

    [Fact]
    public void HoSoDuThau_DetailAndMutations_RequireTenderScope()
    {
        var source = ReadBackendSource("Services/HoSoDuThauService.cs");

        var detailMethod = ExtractBetween(
            source,
            "public async Task<HoSoDuThauDetailDto> GetByIdAsync",
            "public async Task UpdateTrangThaiAsync");
        Assert.Contains("await _tenderAccess.EnsureCanViewAsync(currentUserId, goiThauId);", detailMethod);

        var updateMethod = ExtractBetween(
            source,
            "public async Task UpdateTrangThaiAsync",
            "public async Task AwardAsync");
        Assert.Contains("await _tenderAccess.EnsureCanEditAsync(currentUserId, entity.GoiThauId);", updateMethod);

        var evaluateMethod = ExtractBetween(
            source,
            "public async Task EvaluateAsync",
            "public async Task<GoiThauKetQuaDto> GetKetQuaAsync");
        Assert.Contains("await _tenderAccess.EnsureCanEditAsync(currentUserId, entity.GoiThauId);", evaluateMethod);
    }

    [Fact]
    public void Dashboard_Aggregates_UseTenderScope()
    {
        var source = ReadBackendSource("Services/DashboardService.cs");

        Assert.Contains("ITenderAccessService", source);
        Assert.Contains("await _tenderAccess.ResolveTenderScopeAsync(userId)", source);
        Assert.Contains("query = query.Where(g => allowedKhoaPhongIds.Contains(g.KhoaPhongId ?? -1));", source);
        Assert.Contains("var activeQuery = query", source);
    }

    [Fact]
    public void AuditLogController_RequiresFineGrainedAuditPermission()
    {
        var source = ReadBackendSource("Controllers/AuditLogController.cs");

        Assert.Contains("[HasPermission(\"AUDIT.VIEW_ALL\")]", source);
    }

    [Fact]
    public void NhaThau_BidHistory_UsesTenderScope()
    {
        var source = ReadBackendSource("Services/NhaThauService.cs");

        var historyMethod = ExtractBetween(
            source,
            "public async Task<List<LichSuDauThauItemDto>> GetLichSuDauThauAsync",
            "private async Task EnsureNhaThauExistsAsync");

        Assert.Contains("await _tenderAccess.ResolveTenderScopeDetailAsync(currentUserId)", historyMethod);
        Assert.Contains("query = query.Where(h => h.GoiThau!.NguoiTaoId == currentUserId", historyMethod);
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

    private static string ExtractBetween(string source, string start, string end)
    {
        var startIndex = source.IndexOf(start, StringComparison.Ordinal);
        Assert.True(startIndex >= 0, $"Could not find start marker: {start}");

        var endIndex = source.IndexOf(end, startIndex + start.Length, StringComparison.Ordinal);
        Assert.True(endIndex > startIndex, $"Could not find end marker: {end}");

        return source[startIndex..endIndex];
    }
}
