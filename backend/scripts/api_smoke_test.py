import argparse
import http.cookiejar
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


class ApiTestError(Exception):
    pass


class OdooApiClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")
        self.cookie_jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookie_jar)
        )

    def request(self, method, path, body=None):
        url = self.base_url + path
        data = None
        headers = {}
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"

        request = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with self.opener.open(request, timeout=30) as response:
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace")
            raise ApiTestError("%s %s failed: HTTP %s\n%s" % (method, path, exc.code, raw))
        except urllib.error.URLError as exc:
            raise ApiTestError("%s %s failed: %s" % (method, path, exc.reason))

        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ApiTestError("%s %s returned non-JSON response:\n%s" % (method, path, raw)) from exc

    def get(self, path):
        return self.request("GET", path)

    def post(self, path, body=None):
        return self.request("POST", path, body)

    def put(self, path, body=None):
        return self.request("PUT", path, body)

    def delete(self, path, body=None):
        return self.request("DELETE", path, body)

    def login(self, db, login, password):
        response = self.post(
            "/web/session/authenticate",
            {
                "jsonrpc": "2.0",
                "params": {
                    "db": db,
                    "login": login,
                    "password": password,
                },
            },
        )
        uid = response.get("result", {}).get("uid")
        if not uid:
            raise ApiTestError("Login failed. Check db/login/password.")
        return uid


class SmokeTest:
    def __init__(self, client, keep_data=False):
        self.client = client
        self.keep_data = keep_data
        self.created_class_ids = []
        self.created_student_ids = []
        self.suffix = str(int(time.time()))

    def ok(self, label):
        print("[OK] %s" % label)

    def assert_success(self, response, label):
        if response.get("code") != 200 or response.get("status") != "success":
            raise ApiTestError("%s failed:\n%s" % (label, json.dumps(response, ensure_ascii=False, indent=2)))
        self.ok(label)
        return response.get("data")

    def assert_error_code(self, response, expected_code, label):
        if response.get("code") != expected_code:
            raise ApiTestError(
                "%s expected %s, got:\n%s"
                % (label, expected_code, json.dumps(response, ensure_ascii=False, indent=2))
            )
        self.ok(label)

    def run(self):
        try:
            class_id = self.test_class_flow()
            self.test_student_flow(class_id)
            self.test_error_flow()
        finally:
            if not self.keep_data:
                self.cleanup()

    def test_class_flow(self):
        class_code = "CLS-AUTO-%s" % self.suffix

        data = self.assert_success(
            self.client.post(
                "/edmanage-class",
                {
                    "code": class_code,
                    "name": "Lớp test tự động %s" % self.suffix,
                    "description": "Dữ liệu test tự động",
                },
            ),
            "Create class",
        )
        class_id = data["id"]
        self.created_class_ids.append(class_id)

        self.assert_success(
            self.client.get("/edmanage-class?columnlist=[id,co,na,des]"),
            "Get all classes",
        )
        self.assert_success(
            self.client.get("/edmanage-class/%s?columnlist=[id,co,na,des]" % class_id),
            "Get class by id",
        )
        self.assert_success(
            self.client.get(
                "/edmanage-class/page/1?size=10&search=%s&order=[co:1]&columnlist=[id,co,na,des]"
                % urllib.parse.quote(class_code)
            ),
            "Page/search classes",
        )
        self.assert_success(
            self.client.put(
                "/edmanage-class/%s" % class_id,
                {
                    "name": "Lớp test tự động đã cập nhật",
                    "description": "Cập nhật từ script",
                },
            ),
            "Update class",
        )

        copied = self.assert_success(
            self.client.post("/edmanage-class/%s" % class_id, {"action": "copy"}),
            "Copy class",
        )
        self.created_class_ids.append(copied["id"])

        copied_many = self.assert_success(
            self.client.post("/edmanage-class/copy", {"idlist": [class_id]}),
            "Mass copy class",
        )
        self.created_class_ids.extend(record["id"] for record in copied_many)

        self.assert_success(
            self.client.get("/edmanage-class/export/%s?type=json&columnlist=[id,co,na,des]" % class_id),
            "Export class by id JSON",
        )
        self.assert_success(
            self.client.get("/edmanage-class/export?idlist=[%s]&type=json&columnlist=[id,co,na,des]" % class_id),
            "Mass export class JSON",
        )
        return class_id

    def test_student_flow(self, class_id):
        student_code = "STU-AUTO-%s" % self.suffix
        username = "stu_auto_%s" % self.suffix
        email = "stu_auto_%s@example.com" % self.suffix

        data = self.assert_success(
            self.client.post(
                "/edmanage-student",
                {
                    "code": student_code,
                    "fullname": "Nguyễn Văn Auto",
                    "dob": "2000-02-04",
                    "sex": True,
                    "homecity": "Hà Nội",
                    "address": "Cầu Giấy",
                    "hobbies": "1",
                    "hair_color": "#111111",
                    "email": email,
                    "facebook": "https://facebook.com",
                    "class_id": class_id,
                    "username": username,
                    "password": "Abc@12345",
                    "description": "Dữ liệu test tự động",
                },
            ),
            "Create student",
        )
        student_id = data["id"]
        self.created_student_ids.append(student_id)

        self.assert_success(
            self.client.get("/edmanage-student?columnlist=[id,co,fu,em,cl,ho]"),
            "Get all students",
        )
        self.assert_success(
            self.client.get("/edmanage-student/%s?columnlist=[id,co,fu,em,cl,ho]" % student_id),
            "Get student by id",
        )
        self.assert_success(
            self.client.get(
                "/edmanage-student/page/1?size=10&search=%s&order=[co:1]&columnlist=[id,co,fu,em,cl,ho]"
                % urllib.parse.quote(student_code)
            ),
            "Page/search students",
        )
        self.assert_success(
            self.client.put(
                "/edmanage-student/%s" % student_id,
                {
                    "fullname": "Nguyễn Văn Auto Updated",
                    "homecity": "Đà Nẵng",
                    "hobbies": "2",
                    "description": "Cập nhật từ script",
                },
            ),
            "Update student",
        )

        copied = self.assert_success(
            self.client.post("/edmanage-student/%s" % student_id, {"action": "copy"}),
            "Copy student",
        )
        self.created_student_ids.append(copied["id"])

        copied_many = self.assert_success(
            self.client.post("/edmanage-student/copy", {"idlist": [student_id]}),
            "Mass copy student",
        )
        self.created_student_ids.extend(record["id"] for record in copied_many)

        self.assert_success(
            self.client.get("/edmanage-student/export/%s?type=json&columnlist=[id,co,fu,em,cl,ho]" % student_id),
            "Export student by id JSON",
        )
        self.assert_success(
            self.client.get("/edmanage-student/export?idlist=[%s]&type=json&columnlist=[id,co,fu,em,cl,ho]" % student_id),
            "Mass export student JSON",
        )

    def test_error_flow(self):
        self.assert_error_code(
            self.client.get("/edmanage-student?columnlist=[id,not_a_column]"),
            "C607",
            "Invalid student columnlist",
        )
        self.assert_error_code(
            self.client.get("/edmanage-class/page/1?page=abc"),
            "C601",
            "Invalid class page",
        )

    def cleanup(self):
        if self.created_student_ids:
            try:
                self.assert_success(
                    self.client.delete(
                        "/edmanage-student/delete",
                        {"idlist": sorted(set(self.created_student_ids))},
                    ),
                    "Cleanup students",
                )
            except Exception as exc:
                print("[WARN] Cleanup students failed: %s" % exc)

        if self.created_class_ids:
            try:
                self.assert_success(
                    self.client.delete(
                        "/edmanage-class/delete",
                        {"idlist": sorted(set(self.created_class_ids))},
                    ),
                    "Cleanup classes",
                )
            except Exception as exc:
                print("[WARN] Cleanup classes failed: %s" % exc)


def parse_args():
    parser = argparse.ArgumentParser(description="Smoke test Student Management HTTP APIs.")
    parser.add_argument("--base-url", default="http://localhost:8070")
    parser.add_argument("--db", default="odoo")
    parser.add_argument("--login", default="admin")
    parser.add_argument("--password", default="admin")
    parser.add_argument("--keep-data", action="store_true")
    return parser.parse_args()


def main():
    args = parse_args()
    client = OdooApiClient(args.base_url)
    uid = client.login(args.db, args.login, args.password)
    print("[OK] Login uid=%s" % uid)
    SmokeTest(client, keep_data=args.keep_data).run()
    print("[DONE] API smoke test completed successfully.")


if __name__ == "__main__":
    try:
        main()
    except ApiTestError as exc:
        print("[FAIL] %s" % exc)
        sys.exit(1)
