from .base_controller import BaseController


# Backward-compatible names for integrations using the former helper module.
RestApiMixin = BaseController
RestApiController = BaseController

__all__ = ["BaseController", "RestApiMixin", "RestApiController"]
