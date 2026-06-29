#!/usr/bin/env python3
import json

projectRoot = "/home/binhminh/Developer/Interns/QLQTDT"
batchData = {
    "projectRoot": projectRoot,
    "batchFiles": [
        {"path": ".gitattributes", "language": "unknown", "sizeLines": 2, "fileCategory": "code"},
        {"path": ".understand-anything/.understandignore", "language": "unknown", "sizeLines": 72, "fileCategory": "code"},
        {"path": ".understand-anything/config.json", "language": "json", "sizeLines": 1, "fileCategory": "config"},
        {"path": "backend/Config/FtpConfig.cs", "language": "csharp", "sizeLines": 12, "fileCategory": "code"},
        {"path": "backend/Config/JwtConfig.cs", "language": "csharp", "sizeLines": 11, "fileCategory": "code"},
        {"path": "backend/Controllers/AdminController.cs", "language": "csharp", "sizeLines": 240, "fileCategory": "code"},
        {"path": "backend/Controllers/AuditLogController.cs", "language": "csharp", "sizeLines": 39, "fileCategory": "code"},
        {"path": "backend/Controllers/AuthController.cs", "language": "csharp", "sizeLines": 263, "fileCategory": "code"},
        {"path": "backend/Controllers/BaoCaoController.cs", "language": "csharp", "sizeLines": 149, "fileCategory": "code"},
        {"path": "backend/Controllers/BaseController.cs", "language": "csharp", "sizeLines": 60, "fileCategory": "code"},
        {"path": "backend/Controllers/DashboardController.cs", "language": "csharp", "sizeLines": 39, "fileCategory": "code"},
        {"path": "backend/Controllers/DeXuatController.cs", "language": "csharp", "sizeLines": 133, "fileCategory": "code"},
        {"path": "backend/Controllers/FilesController.cs", "language": "csharp", "sizeLines": 58, "fileCategory": "code"},
        {"path": "backend/Controllers/GoiThauController.cs", "language": "csharp", "sizeLines": 285, "fileCategory": "code"},
        {"path": "backend/Controllers/HinhThucDauThauController.cs", "language": "csharp", "sizeLines": 84, "fileCategory": "code"},
        {"path": "backend/Controllers/HopDongController.cs", "language": "csharp", "sizeLines": 62, "fileCategory": "code"},
        {"path": "backend/Controllers/HoSoDuThauController.cs", "language": "csharp", "sizeLines": 113, "fileCategory": "code"},
        {"path": "backend/Controllers/IntegrationController.cs", "language": "csharp", "sizeLines": 46, "fileCategory": "code"},
        {"path": "backend/Controllers/KhoaPhongController.cs", "language": "csharp", "sizeLines": 144, "fileCategory": "code"},
        {"path": "backend/Controllers/NhaThauController.cs", "language": "csharp", "sizeLines": 141, "fileCategory": "code"},
        {"path": "backend/Controllers/ParallelGroupsController.cs", "language": "csharp", "sizeLines": 172, "fileCategory": "code"},
        {"path": "backend/Controllers/QuyenController.cs", "language": "csharp", "sizeLines": 82, "fileCategory": "code"},
        {"path": "backend/Controllers/ThongBaoController.cs", "language": "csharp", "sizeLines": 56, "fileCategory": "code"},
        {"path": "backend/Controllers/UsersController.cs", "language": "csharp", "sizeLines": 53, "fileCategory": "code"},
        {"path": "backend/Controllers/VaiTroController.cs", "language": "csharp", "sizeLines": 55, "fileCategory": "code"}
    ],
    "batchImportData": {}
}

with open(f"{projectRoot}/.understand-anything/intermediate/batches.json") as f:
    all_data = json.load(f)

for b in all_data["batches"]:
    if b["batchIndex"] == 17:
        batchData["batchImportData"] = b.get("batchImportData", {})
        break

with open(f"{projectRoot}/.understand-anything/tmp/ua-file-analyzer-input-17.json", 'w') as f:
    json.dump(batchData, f, indent=2)

print(f"Input file written with {len(batchData['batchFiles'])} files")
print(f"batchImportData has {len(batchData['batchImportData'])} entries")
# Verify
print("Entries with non-empty imports:")
for k, v in batchData["batchImportData"].items():
    if v:
        print(f"  {k}: {v}")
