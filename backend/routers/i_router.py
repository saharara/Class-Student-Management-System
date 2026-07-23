from abc import ABC, abstractmethod


class IRouter(ABC):
    """HTTP route contract implemented by each Odoo resource router."""

    @abstractmethod
    def get_all_route(self, **kw):
        raise NotImplementedError

    @abstractmethod
    def store_route(self, **kw):
        raise NotImplementedError

    @abstractmethod
    def get_by_page_route(self, init=1, **kw):
        raise NotImplementedError

    @abstractmethod
    def mass_copy_route(self, **kw):
        raise NotImplementedError

    @abstractmethod
    def mass_delete_route(self, **kw):
        raise NotImplementedError

    @abstractmethod
    def import_route(self, **kw):
        raise NotImplementedError

    @abstractmethod
    def export_route(self, **kw):
        raise NotImplementedError

    @abstractmethod
    def export_by_id_route(self, record_id, **kw):
        raise NotImplementedError

    @abstractmethod
    def get_by_id_route(self, record_id, **kw):
        raise NotImplementedError

    @abstractmethod
    def update_route(self, record_id, **kw):
        raise NotImplementedError

    @abstractmethod
    def copy_or_update_route(self, record_id, **kw):
        raise NotImplementedError

    @abstractmethod
    def destroy_route(self, record_id, **kw):
        raise NotImplementedError
