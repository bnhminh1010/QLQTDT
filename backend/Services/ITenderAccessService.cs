using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public sealed record TenderScope(
    HashSet<int> KhoaPhongIds,
    bool IsFullScope,
    bool OwnOnly);

public interface ITenderAccessService
{
    Task<(HashSet<int> KhoaPhongIds, bool IsFullScope)> ResolveTenderScopeAsync(
        int userId,
        string fullScopePermission = "GOITHAU.VIEW_ALL");

    Task<TenderScope> ResolveTenderScopeDetailAsync(
        int userId,
        string fullScopePermission = "GOITHAU.VIEW_ALL");

    Task EnsureCanViewAsync(int userId, int goiThauId);
    Task EnsureCanEditAsync(int userId, int goiThauId);
    Task EnsureCanProcessAsync(int userId, int goiThauId);
    Task<GoiThau> GetAccessibleTenderAsync(int userId, int goiThauId, bool requireFullScope = false);

    /// <summary>
    /// Lấy danh sách tên định danh có thể dùng để match với TheoDoi:
    /// - TenKhoaPhong (vd: "Phòng HCQT")
    /// - MaVaiTro (vd: "BCN_KHOA_PHONG", "BAN_GIAM_DOC")
    /// - Prefix của MaVaiTro trước dấu _ (vd: "BCN_KHOA_PHONG" → "BCN")
    /// </summary>
    Task<HashSet<string>> GetUserViewableNamesAsync(int userId);
}
