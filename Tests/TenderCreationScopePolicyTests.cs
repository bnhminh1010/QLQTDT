using QLQTDT.Api.Security;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Tests.Security;

public class TenderCreationScopePolicyTests
{
    [Fact]
    public void CanCreateForKhoaPhong_FullScope_AllowsAnyDepartment()
    {
        var scope = new TenderScope([], true, false);

        var allowed = TenderCreationScopePolicy.CanCreateForKhoaPhong(scope, 99);

        Assert.True(allowed);
    }

    [Fact]
    public void CanCreateForKhoaPhong_AssignedDepartment_AllowsCreate()
    {
        var scope = new TenderScope([10, 20], false, false);

        var allowed = TenderCreationScopePolicy.CanCreateForKhoaPhong(scope, 20);

        Assert.True(allowed);
    }

    [Fact]
    public void CanCreateForKhoaPhong_UnassignedDepartment_DeniesCreate()
    {
        var scope = new TenderScope([10, 20], false, false);

        var allowed = TenderCreationScopePolicy.CanCreateForKhoaPhong(scope, 30);

        Assert.False(allowed);
    }

    [Fact]
    public void CanCreateForKhoaPhong_OwnOnly_DeniesExplicitDepartment()
    {
        var scope = new TenderScope([], false, true);

        var allowed = TenderCreationScopePolicy.CanCreateForKhoaPhong(scope, 10);

        Assert.False(allowed);
    }

    [Fact]
    public void CanCreateForKhoaPhong_NoDepartmentTarget_DoesNotBlockCreation()
    {
        var scope = new TenderScope([], false, true);

        var allowed = TenderCreationScopePolicy.CanCreateForKhoaPhong(scope, null);

        Assert.True(allowed);
    }
}
