# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _
from odoo.exceptions import UserError


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    company_id = fields.Many2one('res.company', string='Company', required=True,
        default=lambda self: self.env.company)
    is_root_company = fields.Boolean(compute='_compute_is_root_company')
    module_base_import = fields.Boolean("Allow users to import data from CSV/XLS/XLSX/ODS files")
    module_google_calendar = fields.Boolean(
        string='Allow the users to synchronize their calendar  with Google Calendar')
    module_microsoft_calendar = fields.Boolean(
        string='Allow the users to synchronize their calendar with Outlook Calendar')
    module_mail_plugin = fields.Boolean(
        string='Allow integration with the mail plugins'
    )
    module_auth_oauth = fields.Boolean("Use external authentication providers (OAuth)")
    module_auth_ldap = fields.Boolean("LDAP Authentication")
    module_account_inter_company_rules = fields.Boolean("Manage Inter Company")
    module_voip = fields.Boolean("VoIP")
    module_web_unsplash = fields.Boolean("Unsplash Image Library")
    module_sms = fields.Boolean("SMS")
    module_partner_autocomplete = fields.Boolean("Partner Autocomplete")
    module_base_geolocalize = fields.Boolean("GeoLocalize")
    module_google_recaptcha = fields.Boolean("reCAPTCHA")
    module_website_cf_turnstile = fields.Boolean("Cloudflare Turnstile")
    module_google_address_autocomplete = fields.Boolean("Google Address Autocomplete")
    report_footer = fields.Html(related="company_id.report_footer", string='Custom Report Footer', help="Footer text displayed at the bottom of all reports.", readonly=False)
    group_multi_currency = fields.Boolean(string='Multi-Currencies',
            implied_group='base.group_multi_currency',
            help="Allows to work in a multi currency environment")
    external_report_layout_id = fields.Many2one(related="company_id.external_report_layout_id")
    show_effect = fields.Boolean(string="Show Effect", config_parameter='base_setup.show_effect')
    company_count = fields.Integer('Number of Companies', compute="_compute_company_count")
    active_user_count = fields.Integer('Number of Active Users', compute="_compute_active_user_count")
    language_count = fields.Integer('Number of Languages', compute="_compute_language_count")
    company_name = fields.Char(related="company_id.display_name", string="Company Name")
    company_informations = fields.Text(compute="_compute_company_informations")
    company_country_code = fields.Char(related="company_id.country_id.code", string="Company Country Code", readonly=True)
    company_country_group_codes = fields.Json(related="company_id.country_id.country_group_codes")
    profiling_enabled_until = fields.Datetime("Profiling enabled until", config_parameter='base.profiling_enabled_until')

    def open_company(self):
        return {
            'type': 'ir.actions.act_window',
            'name': 'My Company',
            'view_mode': 'form',
            'res_model': 'res.company',
            'res_id': self.env.company.id,
            'target': 'current',
        }

    def open_new_user_default_groups(self):
        default_group = self.env.ref('base.default_user_group', raise_if_not_found=False)
        if not default_group:
            default_group = self.env['res.groups'].create({
                'name': _('Default access for new users'),
            })
            self.env['ir.model.data'].create({
                'name': 'default_user_group',
                'module': 'base',
                'res_id': default_group.id,
                'model': 'res.groups',
                'noupdate': True,
            })
        return {
            'type': 'ir.actions.act_window',
            'name': _("Edit new user default group"),
            'view_mode': 'form',
            'res_model': 'res.groups',
            'res_id': default_group.id,
            'views': [(self.env.ref('base.view_default_groups_form').id, 'form')],
            'target': 'new',
        }

    @api.model
    def _prepare_report_view_action(self, template):
        template_id = self.env.ref(template)
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'ir.ui.view',
            'view_mode': 'form',
            'res_id': template_id.id,
        }

    def edit_external_header(self):
        if not self.external_report_layout_id:
            return False
        return self._prepare_report_view_action(self.external_report_layout_id.key)

    # NOTE: These fields depend on the context, if we want them to be computed
    # we have to make them depend on a field. This is because we are on a TransientModel.
    @api.depends('company_id')
    def _compute_company_count(self):
        company_count = self.env['res.company'].sudo().search_count([])
        for record in self:
            record.company_count = company_count

    @api.depends('company_id')
    def _compute_active_user_count(self):
        active_user_count = self.env['res.users'].sudo().search_count([('share', '=', False)])
        for record in self:
            record.active_user_count = active_user_count

    @api.depends('company_id')
    def _compute_language_count(self):
        language_count = len(self.env['res.lang'].get_installed())
        for record in self:
            record.language_count = language_count

    @api.depends('company_id')
    def _compute_company_informations(self):
        informations = '%s\n' % self.company_id.street if self.company_id.street else ''
        informations += '%s\n' % self.company_id.street2 if self.company_id.street2 else ''
        informations += '%s' % self.company_id.zip if self.company_id.zip else ''
        informations += '\n' if self.company_id.zip and not self.company_id.city else ''
        informations += ' - ' if self.company_id.zip and self.company_id.city else ''
        informations += '%s\n' % self.company_id.city if self.company_id.city else ''
        informations += '%s\n' % self.company_id.state_id.display_name if self.company_id.state_id else ''
        informations += '%s' % self.company_id.country_id.display_name if self.company_id.country_id else ''
        vat_display = self.company_id.country_id.vat_label or _('VAT')
        vat_display = '\n' + vat_display + ': '
        informations += '%s %s' % (vat_display, self.company_id.vat) if self.company_id.vat else ''

        for record in self:
            record.company_informations = informations

    @api.depends('company_id')
    def _compute_is_root_company(self):
        for record in self:
            record.is_root_company = not record.company_id.parent_id
