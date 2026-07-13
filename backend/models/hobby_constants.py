HOBBY_OPTIONS = [
    {"code": 1, "bit": 0, "mask": 1 << 0, "name": "Chơi thể thao"},
    {"code": 2, "bit": 1, "mask": 1 << 1, "name": "Đọc sách"},
    {"code": 3, "bit": 2, "mask": 1 << 2, "name": "Vẽ tranh"},
    {"code": 4, "bit": 3, "mask": 1 << 3, "name": "Xem phim"},
    {"code": 5, "bit": 4, "mask": 1 << 4, "name": "Chụp ảnh"},
    {"code": 6, "bit": 5, "mask": 1 << 5, "name": "Làm vườn"},
    {"code": 7, "bit": 6, "mask": 1 << 6, "name": "Chơi Game"},
    {"code": 8, "bit": 7, "mask": 1 << 7, "name": "Chơi nhạc cụ"},
    {"code": 9, "bit": 8, "mask": 1 << 8, "name": "Sưu tầm"},
    {"code": 10, "bit": 9, "mask": 1 << 9, "name": "Nấu nướng"},
    {"code": 11, "bit": 10, "mask": 1 << 10, "name": "Du lịch"},
    {"code": 12, "bit": 11, "mask": 1 << 11, "name": "Bơi lội"},
    {"code": 13, "bit": 12, "mask": 1 << 12, "name": "Đạp xe"},
    {"code": 14, "bit": 13, "mask": 1 << 13, "name": "Chạy bộ"},
    {"code": 15, "bit": 14, "mask": 1 << 14, "name": "Cờ vua"},
    {"code": 16, "bit": 15, "mask": 1 << 15, "name": "Cờ tướng"},
    {"code": 17, "bit": 16, "mask": 1 << 16, "name": "Lập trình"},
    {"code": 18, "bit": 17, "mask": 1 << 17, "name": "Thiết kế đồ họa"},
    {"code": 19, "bit": 18, "mask": 1 << 18, "name": "Viết lách"},
    {"code": 20, "bit": 19, "mask": 1 << 19, "name": "Nhảy múa"},
    {"code": 21, "bit": 20, "mask": 1 << 20, "name": "Ca hát"},
    {"code": 22, "bit": 21, "mask": 1 << 21, "name": "Yoga"},
    {"code": 23, "bit": 22, "mask": 1 << 22, "name": "Bóng đá"},
    {"code": 24, "bit": 23, "mask": 1 << 23, "name": "Bóng rổ"},
    {"code": 25, "bit": 24, "mask": 1 << 24, "name": "Cầu lông"},
    {"code": 26, "bit": 25, "mask": 1 << 25, "name": "Bóng bàn"},
    {"code": 27, "bit": 26, "mask": 1 << 26, "name": "Học ngoại ngữ"},
    {"code": 28, "bit": 27, "mask": 1 << 27, "name": "Thủ công"},
    {"code": 29, "bit": 28, "mask": 1 << 28, "name": "Origami"},
    {"code": 30, "bit": 29, "mask": 1 << 29, "name": "Cắm trại"},
    {"code": 31, "bit": 30, "mask": 1 << 30, "name": "Làm bánh"},
    {"code": 32, "bit": 31, "mask": 1 << 31, "name": "Tình nguyện"},
]

HOBBY_BY_CODE = {item["code"]: item for item in HOBBY_OPTIONS}
HOBBY_BY_MASK = {item["mask"]: item for item in HOBBY_OPTIONS}
HOBBY_LABELS = {item["code"]: item["name"] for item in HOBBY_OPTIONS}


def hobby_mask(codes):
    mask = 0
    for code in codes:
        item = HOBBY_BY_CODE.get(int(code))
        if item:
            mask |= item["mask"]
    return mask


def hobby_codes(mask):
    mask = int(mask or 0)
    return [item["code"] for item in HOBBY_OPTIONS if mask & item["mask"]]


def hobby_names(mask):
    mask = int(mask or 0)
    return [item["name"] for item in HOBBY_OPTIONS if mask & item["mask"]]
