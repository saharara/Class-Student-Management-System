from ..models.hobby_constants import HOBBY_OPTIONS
from .base_controller import BaseController


class StudentController(BaseController):
    MODEL = "tra_student"
    FIELDS = [
        "id",
        "code",
        "fullname",
        "dob",
        "sex",
        "homecity",
        "address",
        "hobbies",
        "hair_color",
        "email",
        "facebook",
        "class_id",
        "username",
        "password",
        "description",
        "attachment",
    ]
    WRITABLE_FIELDS = [
        "code",
        "fullname",
        "dob",
        "sex",
        "homecity",
        "address",
        "hobbies",
        "hair_color",
        "email",
        "facebook",
        "class_id",
        "username",
        "password",
        "description",
        "attachment",
        "attachment_filename",
    ]
    ALIASES = {
        "id": "id",
        "co": "code",
        "code": "code",
        "fu": "fullname",
        "fullname": "fullname",
        "do": "dob",
        "dob": "dob",
        "se": "sex",
        "sex": "sex",
        "hom": "homecity",
        "homecity": "homecity",
        "ad": "address",
        "address": "address",
        "ho": "hobbies",
        "hobbies": "hobbies",
        "hc": "hair_color",
        "hair_color": "hair_color",
        "em": "email",
        "email": "email",
        "fa": "facebook",
        "facebook": "facebook",
        "cl": "class_id",
        "class_id": "class_id",
        "us": "username",
        "username": "username",
        "pa": "password",
        "password": "password",
        "des": "description",
        "description": "description",
        "att": "attachment",
        "attachment": "attachment",
    }
    SEARCH_FIELDS = [
        "code",
        "fullname",
        "homecity",
        "address",
        "email",
        "facebook",
        "username",
        "description",
    ]
    UNIQUE_COPY_FIELDS = ["code", "username"]
    COPY_VALUES = {"email": ""}
    DEFAULT_ORDER = "code"

    def hobbies(self):
        return self._service().serializer.success(HOBBY_OPTIONS)
