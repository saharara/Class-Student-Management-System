from .base_controller import BaseController


class ClassController(BaseController):
    MODEL = "tra_class"
    FIELDS = ["id", "code", "name", "description", "student_count"]
    WRITABLE_FIELDS = ["code", "name", "description"]
    ALIASES = {
        "id": "id",
        "co": "code",
        "code": "code",
        "na": "name",
        "name": "name",
        "des": "description",
        "description": "description",
        "student_count": "student_count",
        "studentCount": "student_count",
        "sc": "student_count",
    }
    SEARCH_FIELDS = ["code", "name", "description"]
    UNIQUE_COPY_FIELDS = ["code"]
    DEFAULT_ORDER = "code"
