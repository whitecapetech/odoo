# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': """Indian - E-waybill""",
    'countries': ['in'],
    'version': '2.0',
    'category': 'Accounting/Localizations',
    'depends': [
        'l10n_in',
    ],
    'description': """
Indian - E-waybill
====================================
To submit E-waybill through API to the government.
We use "Tera Software Limited" as GSP

Step 1: First you need to create an API username and password in the E-waybill portal.
Step 2: Switch to company related to that GST number
Step 3: Set that username and password in Odoo (Goto: Invoicing/Accounting -> Configration -> Settings -> Indian Electronic WayBill or find "E-waybill" in search bar)
Step 4: Repeat steps 1,2,3 for all GSTIN you have in odoo. If you have a multi-company with the same GST number then perform step 1 for the first company only.
    """,
    'data': [
        'security/ir.model.access.csv',
        'security/ir_rules.xml',
        'data/ewaybill_type_data.xml',
        'views/l10n_in_ewaybill_views.xml',
        'views/account_move_views.xml',
        'views/edi_pdf_report.xml',
        'views/res_config_settings_views.xml',
        'wizard/l10n_in_ewaybill_cancel_views.xml',
        'report/ewaybill_report_views.xml',
        'report/ewaybill_report.xml',
    ],
    'demo': [
        'demo/demo_company.xml',
    ],
    'installable': True,
    # not auto_install because the company can be related to the service industry
    'author': 'Odoo S.A.',
    'license': 'LGPL-3',
}
