# File khai báo module Odoo

{
    "name": "Student Management",
    "summary": "Manage classes and students",
    "description": "Backend APIs and Odoo views for class and student management.",
    "version": "18.0.1.1.0",
    "category": "Education",
    "author": "Tri Anh",
    "license": "LGPL-3",
    "depends": ["base"],
    "data": [
        "backend/security/ir.model.access.csv",
        "backend/views/class_views.xml",
        "backend/views/student_views.xml",
    ],
    "application": True,
    "installable": True,
}
