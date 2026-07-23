from dataclasses import dataclass

from .class_service import ClassApiService
from .rest_api_service import RestApiService


@dataclass(frozen=True)
class ApiResourceConfig:
    """Immutable API configuration copied from a concrete router."""

    MODEL: str
    FIELDS: tuple
    WRITABLE_FIELDS: tuple
    ALIASES: dict
    SEARCH_FIELDS: tuple
    UNIQUE_COPY_FIELDS: tuple
    COPY_VALUES: dict
    DEFAULT_ORDER: str = "id"

    @classmethod
    def from_controller(cls, controller):
        return cls(
            MODEL=controller.MODEL,
            FIELDS=tuple(controller.FIELDS),
            WRITABLE_FIELDS=tuple(controller.WRITABLE_FIELDS),
            ALIASES=dict(controller.ALIASES),
            SEARCH_FIELDS=tuple(controller.SEARCH_FIELDS),
            UNIQUE_COPY_FIELDS=tuple(controller.UNIQUE_COPY_FIELDS),
            COPY_VALUES=dict(controller.COPY_VALUES),
            DEFAULT_ORDER=controller.DEFAULT_ORDER,
        )


class ApiServiceFactory:
    """Build the service implementation for an API resource."""

    SERVICE_BY_MODEL = {
        "tra_class": ClassApiService,
    }

    @classmethod
    def create(cls, controller):
        config = ApiResourceConfig.from_controller(controller)
        service_class = cls.SERVICE_BY_MODEL.get(config.MODEL, RestApiService)
        return service_class(config)
