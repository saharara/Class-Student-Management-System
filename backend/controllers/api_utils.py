from ..services.rest_api_service import RestApiService


class RestApiMixin:
    MODEL = None
    FIELDS = []
    WRITABLE_FIELDS = []
    ALIASES = {}
    SEARCH_FIELDS = []
    UNIQUE_COPY_FIELDS = []
    DEFAULT_ORDER = "id"

    def _service(self):
        return RestApiService(self)

    def get_all(self):
        return self._service().get_all()

    def get_by_page(self, init=1):
        return self._service().get_by_page(init)

    def store(self):
        return self._service().store()

    def get_by_id(self, record_id):
        return self._service().get_by_id(record_id)

    def update(self, record_id):
        return self._service().update(record_id)

    def destroy(self, record_id):
        return self._service().destroy(record_id)

    def copy_or_update(self, record_id):
        return self._service().copy_or_update(record_id)

    def copy(self, record_id):
        return self._service().copy(record_id)

    def mass_copy(self):
        return self._service().mass_copy()

    def mass_delete(self):
        return self._service().mass_delete()

    def import_data(self):
        return self._service().import_data()

    def export_by_id(self, record_id):
        return self._service().export_by_id(record_id)

    def export_data(self):
        return self._service().export_data()
