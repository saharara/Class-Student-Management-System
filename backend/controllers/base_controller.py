from ..services.service_factory import ApiServiceFactory


class BaseController:
    MODEL = None
    FIELDS = []
    WRITABLE_FIELDS = []
    ALIASES = {}
    SEARCH_FIELDS = []
    UNIQUE_COPY_FIELDS = []
    COPY_VALUES = {}
    DEFAULT_ORDER = "id"

    def _service(self):
        """Mô tả: Tạo REST service từ cấu hình controller hiện tại.
        Input: self - controller kế thừa BaseController.
        Output: Đối tượng RestApiService.
        Ràng buộc: Controller phải khai báo đầy đủ cấu hình model.
        Ngoại lệ: Ngoại lệ khởi tạo service được truyền lên.
        """
        return ApiServiceFactory.create(self)

    def get_all(self):
        """Mô tả: Chuyển tiếp yêu cầu lấy toàn bộ bản ghi.
        Input: Request Odoo hiện tại.
        Output: JSON response từ RestApiService.get_all.
        Ràng buộc: Phải chạy trong ngữ cảnh HTTP request.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().get_all()

    def get_by_page(self, init=1):
        """Mô tả: Chuyển tiếp yêu cầu lấy dữ liệu phân trang.
        Input: init - số trang mặc định.
        Output: JSON response từ RestApiService.get_by_page.
        Ràng buộc: init phải có thể dùng làm số trang.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().get_by_page(init)

    def store(self):
        """Mô tả: Chuyển tiếp yêu cầu tạo bản ghi.
        Input: Payload từ request hiện tại.
        Output: JSON response từ RestApiService.store.
        Ràng buộc: Phải chạy trong ngữ cảnh HTTP request.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().store()

    def get_by_id(self, record_id):
        """Mô tả: Chuyển tiếp yêu cầu lấy bản ghi theo id.
        Input: record_id.
        Output: JSON response từ RestApiService.get_by_id.
        Ràng buộc: record_id phải phù hợp với route.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().get_by_id(record_id)

    def update(self, record_id):
        """Mô tả: Chuyển tiếp yêu cầu cập nhật bản ghi.
        Input: record_id và payload request.
        Output: JSON response từ RestApiService.update.
        Ràng buộc: Phải chạy trong ngữ cảnh HTTP request.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().update(record_id)

    def destroy(self, record_id):
        """Mô tả: Chuyển tiếp yêu cầu xóa bản ghi.
        Input: record_id.
        Output: JSON response từ RestApiService.destroy.
        Ràng buộc: record_id phải phù hợp với route.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().destroy(record_id)

    def copy_or_update(self, record_id):
        """Mô tả: Chuyển tiếp yêu cầu sao chép hoặc cập nhật.
        Input: record_id và payload request.
        Output: JSON response từ RestApiService.copy_or_update.
        Ràng buộc: Hành động được xác định bởi payload.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().copy_or_update(record_id)

    def copy(self, record_id):
        """Mô tả: Chuyển tiếp yêu cầu sao chép một bản ghi.
        Input: record_id.
        Output: JSON response từ RestApiService.copy.
        Ràng buộc: Record nguồn phải tồn tại.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().copy(record_id)

    def mass_copy(self):
        """Mô tả: Chuyển tiếp yêu cầu sao chép nhiều bản ghi.
        Input: Danh sách id trong payload request.
        Output: JSON response từ RestApiService.mass_copy.
        Ràng buộc: Phải chạy trong ngữ cảnh HTTP request.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().mass_copy()

    def mass_delete(self):
        """Mô tả: Chuyển tiếp yêu cầu xóa nhiều bản ghi.
        Input: Danh sách id trong payload request.
        Output: JSON response từ RestApiService.mass_delete.
        Ràng buộc: Phải chạy trong ngữ cảnh HTTP request.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().mass_delete()

    def import_data(self):
        """Mô tả: Chuyển tiếp yêu cầu import dữ liệu.
        Input: Tệp và loại tệp trong payload request.
        Output: JSON response từ RestApiService.import_data.
        Ràng buộc: Phải chạy trong ngữ cảnh HTTP request.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().import_data()

    def export_by_id(self, record_id):
        """Mô tả: Chuyển tiếp yêu cầu xuất một bản ghi.
        Input: record_id và tùy chọn xuất trong request.
        Output: JSON response từ RestApiService.export_by_id.
        Ràng buộc: Record nguồn phải tồn tại.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().export_by_id(record_id)

    def export_data(self):
        """Mô tả: Chuyển tiếp yêu cầu xuất nhiều bản ghi.
        Input: Tùy chọn ids, cột và định dạng trong request.
        Output: JSON response từ RestApiService.export_data.
        Ràng buộc: Phải chạy trong ngữ cảnh HTTP request.
        Ngoại lệ: Ngoại lệ service được truyền lên.
        """
        return self._service().export_data()
