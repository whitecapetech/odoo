# -*- coding: utf-8 -*-
import re

from datetime import datetime, timedelta

from odoo import http, _
from odoo.exceptions import AccessDenied
from odoo.http import request
from odoo.addons.web.controllers import home as web_home

TRUSTED_DEVICE_COOKIE = 'td_id'
TRUSTED_DEVICE_AGE_DAYS = 90


class Home(web_home.Home):
    @http.route(
        '/web/login/totp',
        type='http', auth='public', methods=['GET', 'POST'], sitemap=False,
        website=True, multilang=False # website breaks the login layout...
    )
    def web_totp(self, redirect=None, **kwargs):
        if request.session.uid:
            return request.redirect(self._login_redirect(request.session.uid, redirect=redirect))

        if not request.session.get('pre_uid'):
            return request.redirect('/web/login')

        error = None

        user = request.env['res.users'].browse(request.session['pre_uid'])
        if user and request.httprequest.method == 'GET':
            cookies = request.cookies
            key = cookies.get(TRUSTED_DEVICE_COOKIE)
            if key:
                user_match = request.env['auth_totp.device']._check_credentials_for_uid(
                    scope="browser", key=key, uid=user.id)
                if user_match:
                    request.session.finalize(request.env)
                    request.update_env(user=request.session.uid)
                    request.update_context(**request.session.context)
                    return request.redirect(self._login_redirect(request.session.uid, redirect=redirect))

        elif user and request.httprequest.method == 'POST' and kwargs.get('totp_token'):
            try:
                with user._assert_can_auth(user=user.id):
                    credentials = {
                        'type': user._mfa_type(),
                        'token': int(re.sub(r'\s', '', kwargs['totp_token'])),
                    }
                    user._check_credentials(credentials, {'interactive': True})
            except AccessDenied as e:
                error = str(e)
            except ValueError:
                error = _("Invalid authentication code format.")
            else:
                request.session.finalize(request.env)
                request.update_env(user=request.session.uid)
                request.update_context(**request.session.context)
                response = request.redirect(self._login_redirect(request.session.uid, redirect=redirect))
                if kwargs.get('remember'):
                    name = _("%(browser)s on %(platform)s",
                        browser=request.httprequest.user_agent.browser.capitalize(),
                        platform=request.httprequest.user_agent.platform.capitalize(),
                    )

                    if request.geoip.city.name:
                        name += f" ({request.geoip.city.name}, {request.geoip.country_name})"

                    trusted_device_age = request.env['auth_totp.device']._get_trusted_device_age()
                    key = request.env['auth_totp.device'].sudo()._generate(
                        "browser",
                        name,
                        datetime.now() + timedelta(seconds=trusted_device_age)
                    )
                    response.set_cookie(
                        key=TRUSTED_DEVICE_COOKIE,
                        value=key,
                        max_age=trusted_device_age,
                        httponly=True,
                        samesite='Lax'
                    )
                # Crapy workaround for unupdatable Odoo Mobile App iOS (Thanks Apple :@)
                request.session.touch()
                return response

        # Crapy workaround for unupdatable Odoo Mobile App iOS (Thanks Apple :@)
        request.session.touch()
        return request.render('auth_totp.auth_totp_form', {
            'user': user,
            'error': error,
            'redirect': redirect,
        })
