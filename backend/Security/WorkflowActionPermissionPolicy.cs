using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Security;

public static class WorkflowActionPermissionPolicy
{
    public const string ProcessPermission = "WORKFLOW.PROCESS";
    public const string RollbackPermission = "WORKFLOW.ROLLBACK";
    public const string ReassignPermission = "WORKFLOW.REASSIGN";

    public static string GetRequiredPermission(string action) =>
        action switch
        {
            WorkflowHanhDong.ROLLBACK or WorkflowHanhDong.TRA_VE => RollbackPermission,
            WorkflowHanhDong.REASSIGN => ReassignPermission,
            _ => ProcessPermission
        };

    public static bool HasRequiredPermission(string action, IEnumerable<string> permissions)
    {
        var required = GetRequiredPermission(action);
        return permissions.Contains(required, StringComparer.OrdinalIgnoreCase);
    }
}
