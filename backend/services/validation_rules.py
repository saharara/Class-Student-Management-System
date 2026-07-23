CLASS_RULE = {
    "rules": {
        "code": {
            "required": True,
            "label": "Mã lớp",
            "unique": True,
        },
        "name": {
            "required": True,
            "label": "Tên lớp",
        },
    },
    "message": {
        "code": {
            "required": "Mã lớp là trường bắt buộc.",
            "unique": "Mã lớp đã tồn tại. Vui lòng nhập mã khác.",
        },
        "name": {
            "required": "Tên lớp là trường bắt buộc.",
        },
    },
}

STUDENT_RULE = {
    "rules": {
        "code": {
            "required": True,
            "label": "Mã học sinh",
            "unique": True,
        },
        "fullname": {
            "required": True,
            "label": "Họ và tên",
        },
        "dob": {
            "required": True,
            "label": "Ngày sinh",
        },
        "email": {
            "required": True,
            "required_on_copy": False,
            "label": "Email",
            "unique": True,
        },
        "class_id": {
            "required": True,
            "label": "Lớp học",
            "convert": True,
        },
        "username": {
            "required": True,
            "label": "Tài khoản",
            "unique": True,
        },
        "password": {
            "required": True,
            "label": "Mật khẩu",
        },
    },
    "message": {
        "code": {
            "required": "Mã học sinh là trường bắt buộc.",
            "unique": "Mã học sinh đã tồn tại. Vui lòng nhập mã khác.",
        },
        "fullname": {
            "required": "Họ và tên là trường bắt buộc.",
        },
        "dob": {
            "required": "Ngày sinh là trường bắt buộc.",
        },
        "email": {
            "required": "Email là trường bắt buộc.",
            "unique": "Email đã tồn tại. Vui lòng nhập email khác.",
        },
        "class_id": {
            "required": "Lớp học là trường bắt buộc.",
            "convert": "Lớp học không tồn tại. Vui lòng chọn lớp hợp lệ.",
        },
        "username": {
            "required": "Tài khoản là trường bắt buộc.",
            "unique": "Tài khoản đã tồn tại. Vui lòng nhập tài khoản khác.",
        },
        "password": {
            "required": "Mật khẩu là trường bắt buộc.",
        },
    },
}

MODEL_RULES = {
    "tra_class": CLASS_RULE,
    "tra_student": STUDENT_RULE,
}