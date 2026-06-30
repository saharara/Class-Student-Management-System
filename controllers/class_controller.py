from odoo import http

from .api_utils import RestApiMixin


class ClassController(http.Controller, RestApiMixin):
    MODEL = "tra_class"
    FIELDS = ["id", "code", "name", "description"]
    WRITABLE_FIELDS = ["code", "name", "description"]
    ALIASES = {
        "id": "id",
        "co": "code",
        "code": "code",
        "na": "name",
        "name": "name",
        "des": "description",
        "description": "description",
    }
    SEARCH_FIELDS = ["code", "name", "description"]
    UNIQUE_COPY_FIELDS = ["code"]
    DEFAULT_ORDER = "code"

    @http.route("/edmanage-class", type="http", auth="user", methods=["GET"], csrf=False)
    def get_all_route(self, **kw):
        return self.get_all()

    @http.route("/edmanage-class", type="http", auth="user", methods=["POST"], csrf=False)
    def store_route(self, **kw):
        return self.store()

    @http.route(
        ["/edmanage-class/page/<int:init>", "/edmanage-class/page/<int:init>/"],
        type="http",
        auth="user",
        methods=["GET"],
        csrf=False,
    )
    def get_by_page_route(self, init=1, **kw):
        return self.get_by_page(init)

    @http.route("/edmanage-class/copy", type="http", auth="user", methods=["POST"], csrf=False)
    def mass_copy_route(self, **kw):
        return self.mass_copy()

    @http.route("/edmanage-class/delete", type="http", auth="user", methods=["DELETE"], csrf=False)
    def mass_delete_route(self, **kw):
        return self.mass_delete()

    @http.route("/edmanage-class/import", type="http", auth="user", methods=["POST"], csrf=False)
    def import_route(self, **kw):
        return self.import_data()

    @http.route("/edmanage-class/export", type="http", auth="user", methods=["GET"], csrf=False)
    def export_route(self, **kw):
        return self.export_data()

    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["GET"], csrf=False)
    def get_by_id_route(self, record_id, **kw):
        return self.get_by_id(record_id)

    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["PUT"], csrf=False)
    def update_route(self, record_id, **kw):
        return self.update(record_id)

    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["POST"], csrf=False)
    def copy_or_update_route(self, record_id, **kw):
        return self.copy_or_update(record_id)

    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["DELETE"], csrf=False)
    def destroy_route(self, record_id, **kw):
        return self.destroy(record_id)
