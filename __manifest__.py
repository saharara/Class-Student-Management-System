# File khai báo module Odoo

{
    "name": "Student Management",
    "summary": "Manage classes and students",
    "description": "Backend APIs and Odoo views for class and student management.",
    "version": "18.0.1.0.0",
    "category": "Education",
    "author": "Tri Anh",
    "license": "LGPL-3",
    "depends": ["base"],
    "data": [
        "security/ir.model.access.csv",
        "data/hobby_data.xml",
        "views/class_views.xml",
        "views/student_views.xml",
        "views/hobby_views.xml",
    ],
    "application": True,
    "installable": True,
}
