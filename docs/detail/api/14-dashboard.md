# Module Dashboard (4 APIs)

## GET /api/dashboard/summary

Tổng quan: số gói thầu theo trạng thái.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "tongGoiThau": 45,
    "trangThai": {
      "DU_THAO": 5,
      "DANG_DU_THAU": 12,
      "DANG_XET_HO_SO": 8,
      "DA_CHON_NHA_THAU": 10,
      "DA_KY_HOP_DONG": 7,
      "DA_HOAN_THANH": 3
    },
    "tongGiaTriDuToan": 150000000000,
    "tongGiaTrungThau": 135000000000,
    "tiLeTietKiem": 10,
    "goiThauQuaHan": 2
  }
}
```

---

## GET /api/dashboard/statistics

Thống kê: số lượng, tỷ lệ đúng hạn.

**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| nam | int | năm hiện tại | Năm thống kê |
| quy | int | - | Quý (1-4) |

**Response 200:**
```json
{
  "success": true,
  "data": {
        "theoThang": [
      { "thang": 1, "soLuong": 3, "tongGiaTri": 5000000000 },
      { "thang": 2, "soLuong": 5, "tongGiaTri": 8000000000 }
    ],
    "theoKhoaPhong": [
      { "khoaPhong": "Nội tổng hợp", "soLuong": 10, "tongGiaTri": 30000000000 },
      { "khoaPhong": "Ngoại tổng hợp", "soLuong": 8, "tongGiaTri": 25000000000 }
    ],
    "theoHinhThuc": [
      { "hinhThuc": "Chỉ định thầu", "soLuong": 15, "tiLe": 33 },
      { "hinhThuc": "Đấu thầu rộng rãi", "soLuong": 30, "tiLe": 67 }
    ]
  }
}
```

---

## GET /api/dashboard/pending

Các việc cần xử lý theo role của user hiện tại.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "choPheDuyet": 3,
    "choDanhGiaHoSo": 5,
    "choKyHopDong": 2,
    "choNghiemThu": 1,
    "quaHan": 1
  }
}
```

---

## GET /api/dashboard/export

Export báo cáo (Excel/PDF).

**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| loai | string | excel | Định dạng (excel/pdf) |
| tuNgay | date | - | Từ ngày |
| denNgay | date | - | Đến ngày |

**Response 200:** (Binary file download)

**Headers:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="bao_cao_dau_thau_2026.xlsx"
```
