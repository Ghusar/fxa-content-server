/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const Cocktail = require('cocktail');
  const FormView = require('../form');
  const ModalSettingsPanelMixin = require('../mixins/modal-settings-panel-mixin');
  const Template = require('templates/settings/recovery_codes.mustache');

  // TODO: Wacky hack to print div contents
  // Ref: https://stackoverflow.com/questions/2255291/print-the-contents-of-a-div
  function printElem(id) {
    const content = document.getElementById(id).innerHTML;
    const mywindow = window.open('', 'Print', 'height=600,width=800');

    mywindow.document.write('<html><head><title>Print</title>');
    mywindow.document.write('</head><body >');
    mywindow.document.write(content);
    mywindow.document.write('</body></html>');

    mywindow.document.close();
    mywindow.focus();
    mywindow.print();
    mywindow.close();
    return true;
  }

  var View = FormView.extend({
    template: Template,
    className: 'recovery-codes',
    viewName: 'settings.security.recovery-codes',

    events: {
      'click .cancel-done': FormView.preventDefaultThen('_returnToSecurity')
    },

    initialize () {
      this.on('modal-cancel', () => this._returnToSecurity());
    },

    beforeRender () {},

    setInitialContext (context) {
      context.set({
        recoveryCodes: this.model.get('recoveryCodes')
      });
    },

    submit () {
      this.logViewEvent('printed');

      printElem('recovery-code-container');
    },

    _returnToSecurity () {
      // Log some stats
      this.navigate('settings/security');
    }
  });

  Cocktail.mixin(
    View,
    ModalSettingsPanelMixin
  );

  module.exports = View;
});
