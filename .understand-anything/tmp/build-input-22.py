import json

batch_files = [
    {"path": "backend/Models/Interfaces.cs", "language": "csharp", "sizeLines": 16, "fileCategory": "code"},
    {"path": "backend/Models/Entities/NguoiDung.cs", "language": "csharp", "sizeLines": 25, "fileCategory": "code"},
    {"path": "backend/Models/Entities/NguoiDungKhoaPhongVaiTro.cs", "language": "csharp", "sizeLines": 17, "fileCategory": "code"},
    {"path": "backend/Models/Entities/VaiTro.cs", "language": "csharp", "sizeLines": 21, "fileCategory": "code"},
    {"path": "backend/Models/Entities/Quyen.cs", "language": "csharp", "sizeLines": 11, "fileCategory": "code"},
    {"path": "backend/Models/Entities/VaiTroQuyen.cs", "language": "csharp", "sizeLines": 10, "fileCategory": "code"},
    {"path": "backend/Models/Entities/KhoaPhong.cs", "language": "csharp", "sizeLines": 12, "fileCategory": "code"},
    {"path": "backend/Models/Entities/GoiThau.cs", "language": "csharp", "sizeLines": 94, "fileCategory": "code"},
    {"path": "backend/Models/Entities/LichSuTrangThaiGoiThau.cs", "language": "csharp", "sizeLines": 11, "fileCategory": "code"},
    {"path": "backend/Models/Entities/HinhThucDauThau.cs", "language": "csharp", "sizeLines": 19, "fileCategory": "code"},
    {"path": "backend/Models/Entities/Workflow.cs", "language": "csharp", "sizeLines": 22, "fileCategory": "code"},
    {"path": "backend/Models/Entities/BuocWorkflow.cs", "language": "csharp", "sizeLines": 52, "fileCategory": "code"},
    {"path": "backend/Models/Entities/ChuyenTiepWorkflow.cs", "language": "csharp", "sizeLines": 22, "fileCategory": "code"},
    {"path": "backend/Models/Entities/NhomNhanhWorkflow.cs", "language": "csharp", "sizeLines": 20, "fileCategory": "code"},
    {"path": "backend/Models/Entities/NhanhWorkflow.cs", "language": "csharp", "sizeLines": 22, "fileCategory": "code"},
    {"path": "backend/Models/Entities/WorkflowInstance.cs", "language": "csharp", "sizeLines": 20, "fileCategory": "code"},
    {"path": "backend/Models/Entities/WorkflowStepInstance.cs", "language": "csharp", "sizeLines": 42, "fileCategory": "code"},
    {"path": "backend/Models/Entities/TaiLieuHoSo.cs", "language": "csharp", "sizeLines": 34, "fileCategory": "code"},
    {"path": "backend/Models/Entities/HoSoDuThau.cs", "language": "csharp", "sizeLines": 35, "fileCategory": "code"},
    {"path": "backend/Models/Entities/HopDong.cs", "language": "csharp", "sizeLines": 15, "fileCategory": "code"},
    {"path": "backend/Models/Entities/NhaThau.cs", "language": "csharp", "sizeLines": 14, "fileCategory": "code"},
    {"path": "backend/Models/Entities/DeXuatMuaSam.cs", "language": "csharp", "sizeLines": 22, "fileCategory": "code"},
    {"path": "backend/Models/Entities/ThongBao.cs", "language": "csharp", "sizeLines": 20, "fileCategory": "code"},
    {"path": "backend/Models/Entities/NhomVaiTro.cs", "language": "csharp", "sizeLines": 15, "fileCategory": "code"},
]

# All imports are empty for entity files
batch_import_data = {}
for b in batch_files:
    batch_import_data[b["path"]] = []

input_json = {
    "projectRoot": "/home/binhminh/Developer/Interns/QLQTDT",
    "batchFiles": batch_files,
    "batchImportData": batch_import_data
}

with open("/home/binhminh/Developer/Interns/QLQTDT/.understand-anything/tmp/ua-file-analyzer-input-22.json", "w") as f:
    json.dump(input_json, f, indent=2)

print(f"Wrote {len(batch_files)} files to input JSON")
total_imports = sum(len(v) for v in batch_import_data.values())
print(f"Total import edges to emit: {total_imports}")
