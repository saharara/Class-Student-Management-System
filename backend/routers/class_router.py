from odoo import http

from ..controllers.class_controller import ClassController
from .i_router import IRouter


class ClassRouter(http.Controller, IRouter):
    @property
    def controller(self):
        return ClassController()

    @http.route("/edmanage-class", type="http", auth="user", methods=["GET"], csrf=False)
    def get_all_route(self, **kw):
        """Mô tả: Endpoint lấy toàn bộ lớp học.
        Input: Tham số HTTP tùy chọn trong kw.
        Output: JSON response danh sách lớp.
        Ràng buộc: Route public, CORS bật và CSRF tắt theo cấu hình decorator.
        Ngoại lệ: Lỗi nghiệp vụ được service chuyển thành phản hồi API.
        """
        return self.controller.get_all()

    @http.route("/edmanage-class", type="http", auth="user", methods=["POST"], csrf=False)
    def store_route(self, **kw):
        """Mô tả: Endpoint tạo một lớp học.
        Input: Payload HTTP và tham số kw.
        Output: JSON response chứa lớp vừa tạo.
        Ràng buộc: Dữ liệu phải thỏa quy tắc của model lớp.
        Ngoại lệ: Lỗi validation/ORM được service chuyển thành phản hồi API.
        """
        return self.controller.store()

    @http.route(
        ["/edmanage-class/page/<int:init>", "/edmanage-class/page/<int:init>/"],
        type="http",
        auth="user",
        methods=["GET"],
        csrf=False,
    )
    def get_by_page_route(self, init=1, **kw):
        """Mô tả: Endpoint lấy lớp học theo trang.
        Input: init - trang mặc định và tham số HTTP.
        Output: JSON response dữ liệu phân trang.
        Ràng buộc: Trang và cỡ trang phải là số nguyên dương.
        Ngoại lệ: Lỗi tham số được service chuyển thành phản hồi API.
        """
        return self.controller.get_by_page(init)

    @http.route("/edmanage-class/copy", type="http", auth="user", methods=["POST"], csrf=False)
    def mass_copy_route(self, **kw):
        """Mô tả: Endpoint sao chép nhiều lớp học.
        Input: Danh sách id trong payload HTTP.
        Output: JSON response chứa các bản sao.
        Ràng buộc: Tất cả lớp nguồn phải tồn tại.
        Ngoại lệ: Lỗi sao chép được service chuyển thành phản hồi API.
        """
        return self.controller.mass_copy()

    @http.route("/edmanage-class/delete", type="http", auth="user", methods=["DELETE"], csrf=False)
    def mass_delete_route(self, **kw):
        """Mô tả: Endpoint xóa nhiều lớp học.
        Input: Danh sách id trong payload HTTP.
        Output: JSON response kết quả xóa.
        Ràng buộc: Không xóa lớp đang có sinh viên.
        Ngoại lệ: Lỗi quan hệ hoặc ORM được chuyển thành phản hồi API.
        """
        return self.controller.mass_delete()

    @http.route("/edmanage-class/import", type="http", auth="user", methods=["POST"], csrf=False)
    def import_route(self, **kw):
        """Mô tả: Endpoint import danh sách lớp từ tệp.
        Input: Tệp upload và loại tệp trong request.
        Output: JSON response chứa các lớp đã tạo.
        Ràng buộc: Định dạng tệp và dữ liệu lớp phải hợp lệ.
        Ngoại lệ: Lỗi import được service chuyển thành phản hồi API.
        """
        return self.controller.import_data()

    @http.route("/edmanage-class/export", type="http", auth="user", methods=["GET"], csrf=False)
    def export_route(self, **kw):
        """Mô tả: Endpoint xuất danh sách lớp.
        Input: ids, columnlist và type tùy chọn.
        Output: JSON response chứa dữ liệu hoặc tệp base64.
        Ràng buộc: Cột và định dạng xuất phải được hỗ trợ.
        Ngoại lệ: Lỗi xuất được service chuyển thành phản hồi API.
        """
        return self.controller.export_data()

    @http.route(
        ["/edmanage-class/export/<int:record_id>", "/edmanage-class/export/<int:record_id>/"],
        type="http",
        auth="user",
        methods=["GET"],
        csrf=False,
    )
    def export_by_id_route(self, record_id, **kw):
        """Mô tả: Endpoint xuất một lớp theo id.
        Input: record_id và tùy chọn xuất.
        Output: JSON response chứa dữ liệu hoặc tệp base64.
        Ràng buộc: Lớp phải tồn tại.
        Ngoại lệ: Lỗi xuất được service chuyển thành phản hồi API.
        """
        return self.controller.export_by_id(record_id)

    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["GET"], csrf=False)
    def get_by_id_route(self, record_id, **kw):
        """Mô tả: Endpoint lấy chi tiết một lớp.
        Input: record_id và columnlist tùy chọn.
        Output: JSON response chứa lớp học.
        Ràng buộc: Lớp phải tồn tại.
        Ngoại lệ: Lỗi tra cứu được service chuyển thành phản hồi API.
        """
        return self.controller.get_by_id(record_id)

    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["PUT"], csrf=False)
    def update_route(self, record_id, **kw):
        """Mô tả: Endpoint cập nhật lớp học.
        Input: record_id và payload HTTP.
        Output: JSON response chứa lớp sau cập nhật.
        Ràng buộc: Chỉ các trường cho phép được cập nhật.
        Ngoại lệ: Lỗi validation/ORM được service chuyển thành phản hồi API.
        """
        return self.controller.update(record_id)

    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["POST"], csrf=False)
    def copy_or_update_route(self, record_id, **kw):
        """Mô tả: Endpoint sao chép hoặc cập nhật một lớp.
        Input: record_id, action và payload HTTP.
        Output: JSON response kết quả thao tác.
        Ràng buộc: Hành động được xác định từ payload.
        Ngoại lệ: Lỗi nghiệp vụ được service chuyển thành phản hồi API.
        """
        return self.controller.copy_or_update(record_id)

    @http.route("/edmanage-class/<int:record_id>", type="http", auth="user", methods=["DELETE"], csrf=False)
    def destroy_route(self, record_id, **kw):
        """Mô tả: Endpoint xóa một lớp học.
        Input: record_id.
        Output: JSON response kết quả xóa.
        Ràng buộc: Không xóa lớp đang có sinh viên.
        Ngoại lệ: Lỗi quan hệ hoặc ORM được chuyển thành phản hồi API.
        """
        return self.controller.destroy(record_id)
