from odoo import fields, models


class UomUom(models.Model):
    _inherit = "uom.uom"

    # As per GST Rules you need to Specify UQC given by GST.
    l10n_in_code = fields.Char("Indian GST UQC", help="Unique Quantity Code (UQC) under GST")
