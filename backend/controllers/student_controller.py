from odoo import http

from .api_utils import RestApiMixin


class StudentController(http.Controller, RestApiMixin):
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
    UNIQUE_COPY_FIELDS = ["code", "email", "username"]
    DEFAULT_ORDER = "code"

    @http.route("/edmanage-student", type="http", auth="user", methods=["GET"], csrf=False)
    def get_all_route(self, **kw):
        return self.get_all()

    @http.route("/edmanage-student", type="http", auth="user", methods=["POST"], csrf=False)
    def store_route(self, **kw):
        return self.store()

    @http.route(
        ["/edmanage-student/page/<int:init>", "/edmanage-student/page/<int:init>/"],
        type="http",
        auth="user",
        methods=["GET"],
        csrf=False,
    )
    def get_by_page_route(self, init=1, **kw):
        return self.get_by_page(init)

    @http.route("/edmanage-student/copy", type="http", auth="user", methods=["POST"], csrf=False)
    def mass_copy_route(self, **kw):
        return self.mass_copy()

    @http.route("/edmanage-student/delete", type="http", auth="user", methods=["DELETE"], csrf=False)
    def mass_delete_route(self, **kw):
        return self.mass_delete()

    @http.route("/edmanage-student/import", type="http", auth="user", methods=["POST"], csrf=False)
    def import_route(self, **kw):
        return self.import_data()

    @http.route("/edmanage-student/export", type="http", auth="user", methods=["GET"], csrf=False)
    def export_route(self, **kw):
        return self.export_data()

    @http.route(
        ["/edmanage-student/export/<int:record_id>", "/edmanage-student/export/<int:record_id>/"],
        type="http",
        auth="user",
        methods=["GET"],
        csrf=False,
    )
    def export_by_id_route(self, record_id, **kw):
        return self.export_by_id(record_id)

    @http.route("/edmanage-student/<int:record_id>", type="http", auth="user", methods=["GET"], csrf=False)
    def get_by_id_route(self, record_id, **kw):
        return self.get_by_id(record_id)

    @http.route("/edmanage-student/<int:record_id>", type="http", auth="user", methods=["PUT"], csrf=False)
    def update_route(self, record_id, **kw):
        return self.update(record_id)

    @http.route("/edmanage-student/<int:record_id>", type="http", auth="user", methods=["POST"], csrf=False)
    def copy_or_update_route(self, record_id, **kw):
        return self.copy_or_update(record_id)

    @http.route("/edmanage-student/<int:record_id>", type="http", auth="user", methods=["DELETE"], csrf=False)
    def destroy_route(self, record_id, **kw):
        return self.destroy(record_id)
