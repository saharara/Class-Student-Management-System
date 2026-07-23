from odoo import http

from ..controllers.student_controller import StudentController
from .i_router import IRouter


class StudentRouter(http.Controller, IRouter):
    @property
    def controller(self):
        return StudentController()

    @http.route("/edmanage-student/hobbies", type="http", auth="user", methods=["GET"], csrf=False)
    def hobbies_route(self, **kw):
        """Mô tả: Endpoint lấy danh mục sở thích.
        Input: Tham số HTTP tùy chọn trong kw.
        Output: JSON response chứa các lựa chọn sở thích.
        Ràng buộc: Danh mục lấy từ HOBBY_OPTIONS.
        Ngoại lệ: Ngoại lệ tạo response được truyền lên.
        """
        return self.controller.hobbies()

    @http.route("/edmanage-student", type="http", auth="user", methods=["GET"], csrf=False)
    def get_all_route(self, **kw):
        """Mô tả: Endpoint lấy toàn bộ sinh viên.
        Input: Tham số HTTP tùy chọn.
        Output: JSON response danh sách sinh viên.
        Ràng buộc: Các cột yêu cầu phải được công khai.
        Ngoại lệ: Lỗi nghiệp vụ được service chuyển thành phản hồi API.
        """
        return self.controller.get_all()

    @http.route("/edmanage-student", type="http", auth="user", methods=["POST"], csrf=False)
    def store_route(self, **kw):
        """Mô tả: Endpoint tạo một sinh viên.
        Input: Payload HTTP và tham số kw.
        Output: JSON response chứa sinh viên vừa tạo.
        Ràng buộc: Dữ liệu phải thỏa quy tắc model sinh viên.
        Ngoại lệ: Lỗi validation/ORM được service chuyển thành phản hồi API.
        """
        return self.controller.store()

    @http.route(
        ["/edmanage-student/page/<int:init>", "/edmanage-student/page/<int:init>/"],
        type="http",
        auth="user",
        methods=["GET"],
        csrf=False,
    )
    def get_by_page_route(self, init=1, **kw):
        """Mô tả: Endpoint lấy sinh viên theo trang.
        Input: init - trang mặc định và tham số HTTP.
        Output: JSON response dữ liệu phân trang.
        Ràng buộc: Trang và cỡ trang phải là số nguyên dương.
        Ngoại lệ: Lỗi tham số được service chuyển thành phản hồi API.
        """
        return self.controller.get_by_page(init)

    @http.route("/edmanage-student/copy", type="http", auth="user", methods=["POST"], csrf=False)
    def mass_copy_route(self, **kw):
        """Mô tả: Endpoint sao chép nhiều sinh viên.
        Input: Danh sách id trong payload HTTP.
        Output: JSON response chứa các bản sao.
        Ràng buộc: Tất cả sinh viên nguồn phải tồn tại.
        Ngoại lệ: Lỗi sao chép được service chuyển thành phản hồi API.
        """
        return self.controller.mass_copy()

    @http.route("/edmanage-student/delete", type="http", auth="user", methods=["DELETE"], csrf=False)
    def mass_delete_route(self, **kw):
        """Mô tả: Endpoint xóa nhiều sinh viên.
        Input: Danh sách id trong payload HTTP.
        Output: JSON response kết quả xóa.
        Ràng buộc: Tất cả id phải hợp lệ và tồn tại.
        Ngoại lệ: Lỗi xóa được service chuyển thành phản hồi API.
        """
        return self.controller.mass_delete()

    @http.route("/edmanage-student/import", type="http", auth="user", methods=["POST"], csrf=False)
    def import_route(self, **kw):
        """Mô tả: Endpoint import danh sách sinh viên từ tệp.
        Input: Tệp upload và loại tệp trong request.
        Output: JSON response chứa sinh viên đã tạo.
        Ràng buộc: Định dạng tệp và từng dòng phải hợp lệ.
        Ngoại lệ: Lỗi import được service chuyển thành phản hồi API.
        """
        return self.controller.import_data()

    @http.route("/edmanage-student/export", type="http", auth="user", methods=["GET"], csrf=False)
    def export_route(self, **kw):
        """Mô tả: Endpoint xuất danh sách sinh viên.
        Input: ids, columnlist và type tùy chọn.
        Output: JSON response chứa dữ liệu hoặc tệp base64.
        Ràng buộc: Cột và định dạng xuất phải được hỗ trợ.
        Ngoại lệ: Lỗi xuất được service chuyển thành phản hồi API.
        """
        return self.controller.export_data()

    @http.route(
        ["/edmanage-student/export/<int:record_id>", "/edmanage-student/export/<int:record_id>/"],
        type="http",
        auth="user",
        methods=["GET"],
        csrf=False,
    )
    def export_by_id_route(self, record_id, **kw):
        """Mô tả: Endpoint xuất một sinh viên theo id.
        Input: record_id và tùy chọn xuất.
        Output: JSON response chứa dữ liệu hoặc tệp base64.
        Ràng buộc: Sinh viên phải tồn tại.
        Ngoại lệ: Lỗi xuất được service chuyển thành phản hồi API.
        """
        return self.controller.export_by_id(record_id)

    @http.route("/edmanage-student/<int:record_id>", type="http", auth="user", methods=["GET"], csrf=False)
    def get_by_id_route(self, record_id, **kw):
        """Mô tả: Endpoint lấy chi tiết một sinh viên.
        Input: record_id và columnlist tùy chọn.
        Output: JSON response chứa sinh viên.
        Ràng buộc: Sinh viên phải tồn tại.
        Ngoại lệ: Lỗi tra cứu được service chuyển thành phản hồi API.
        """
        return self.controller.get_by_id(record_id)

    @http.route("/edmanage-student/<int:record_id>", type="http", auth="user", methods=["PUT"], csrf=False)
    def update_route(self, record_id, **kw):
        """Mô tả: Endpoint cập nhật sinh viên.
        Input: record_id và payload HTTP.
        Output: JSON response chứa sinh viên sau cập nhật.
        Ràng buộc: Chỉ các trường cho phép được cập nhật.
        Ngoại lệ: Lỗi validation/ORM được service chuyển thành phản hồi API.
        """
        return self.controller.update(record_id)

    @http.route("/edmanage-student/<int:record_id>", type="http", auth="user", methods=["POST"], csrf=False)
    def copy_or_update_route(self, record_id, **kw):
        """Mô tả: Endpoint sao chép hoặc cập nhật một sinh viên.
        Input: record_id, action và payload HTTP.
        Output: JSON response kết quả thao tác.
        Ràng buộc: Hành động được xác định từ payload.
        Ngoại lệ: Lỗi nghiệp vụ được service chuyển thành phản hồi API.
        """
        return self.controller.copy_or_update(record_id)

    @http.route("/edmanage-student/<int:record_id>", type="http", auth="user", methods=["DELETE"], csrf=False)
    def destroy_route(self, record_id, **kw):
        """Mô tả: Endpoint xóa một sinh viên.
        Input: record_id.
        Output: JSON response kết quả xóa.
        Ràng buộc: Sinh viên phải tồn tại.
        Ngoại lệ: Lỗi xóa được service chuyển thành phản hồi API.
        """
        return self.controller.destroy(record_id)
