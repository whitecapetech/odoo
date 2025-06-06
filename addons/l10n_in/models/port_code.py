from odoo import fields, models


class L10n_InPortCode(models.Model):
    """Port code must be mentioned in export and import of goods under GST."""
    _name = 'l10n_in.port.code'
    _description = "Indian port code"
    _rec_name = 'code'

    code = fields.Char(string="Port Code", required=True)
    name = fields.Char(string="Port", required=True)
    state_id = fields.Many2one('res.country.state', string="State")

    _code_uniq = models.Constraint(
        'unique (code)',
        'The Port Code must be unique!',
    )
