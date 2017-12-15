/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const intern = require('intern');
const registerSuite = require('intern!object');
const TestHelpers = require('tests/lib/helpers');
const FunctionalHelpers = require('tests/functional/lib/helpers');
const selectors = require('tests/functional/lib/selectors');

const config = intern.config;

const SIGNUP_URL = config.fxaContentRoot + 'signup?canChangeEmail=true';
const SIGNIN_URL = config.fxaContentRoot + 'signin?canChangeEmail=true';
const SETTINGS_URL = config.fxaContentRoot + 'settings?canChangeEmail=true';
const SIGNIN_URL_NO_CHANGE_EMAIL = config.fxaContentRoot + 'signin';
const PASSWORD = 'password';
const NEW_PASSWORD = 'password1';

let email;
let secondaryEmail;

const {
  clearBrowserState,
  click,
  closeCurrentWindow,
  fillOutChangePassword,
  fillOutResetPassword,
  fillOutCompleteResetPassword,
  fillOutSignUp,
  fillOutSignIn,
  openPage,
  openVerificationLinkInNewTab,
  openVerificationLinkInSameTab,
  noSuchElement,
  switchToWindow,
  testElementExists,
  testElementTextEquals,
  testErrorTextInclude,
  testSuccessWasShown,
  type,
  visibleByQSA,
} = FunctionalHelpers;

registerSuite({
  name: 'settings change email',

  beforeEach: function () {
    email = TestHelpers.createEmail();
    secondaryEmail = TestHelpers.createEmail();
    return this.remote.then(clearBrowserState())
      .then(openPage(SIGNUP_URL, selectors.SIGNUP.HEADER))
      .then(fillOutSignUp(email, PASSWORD))
      .then(testElementExists(selectors.CONFIRM_SIGNUP.HEADER))
      .then(openVerificationLinkInSameTab(email, 0))
      .then(testElementExists(selectors.SETTINGS.HEADER))
      .then(click(selectors.EMAIL.MENU_BUTTON))

      // add secondary email, verify
      .then(type(selectors.EMAIL.INPUT, secondaryEmail))
      .then(click(selectors.EMAIL.ADD_BUTTON))
      .then(testElementExists(selectors.EMAIL.NOT_VERIFIED_LABEL))
      .then(openVerificationLinkInSameTab(secondaryEmail, 0, {
        query: {
          canChangeEmail: true
        }
      }))
      .then(testSuccessWasShown())

      // set new primary email
      .then(openPage(SETTINGS_URL, selectors.SETTINGS.HEADER))
      .then(click(selectors.EMAIL.MENU_BUTTON))
      .then(testElementTextEquals(selectors.EMAIL.ADDRESS_LABEL, secondaryEmail))
      .then(testElementExists(selectors.EMAIL.VERIFIED_LABEL))
      .then(click(selectors.EMAIL.SET_PRIMARY_EMAIL_BUTTON))
      .then(visibleByQSA(selectors.EMAIL.SUCCESS));
  },

  afterEach: function () {
    return this.remote.then(clearBrowserState());
  },

  'does no show change email option if query `canChangeEmail` not set': function () {
    return this.remote
      // sign out
      .then(click(selectors.SETTINGS.SIGNOUT))
      .then(testElementExists(selectors.SIGNIN.HEADER))

      // sign in and does not show change primary email button
      .then(openPage(SIGNIN_URL_NO_CHANGE_EMAIL, selectors.SIGNIN.HEADER))
      .then(testElementExists(selectors.SIGNIN.HEADER))
      .then(fillOutSignIn(secondaryEmail, PASSWORD))
      .then(click(selectors.EMAIL.MENU_BUTTON ))
      .then(noSuchElement(selectors.EMAIL.SET_PRIMARY_EMAIL_BUTTON));
  },

  'can change primary email and login': function () {
    return this.remote
      // sign out
      .then(click(selectors.SETTINGS.SIGNOUT))
      .then(testElementExists(selectors.SIGNIN.HEADER))

      // sign in with old primary email fails
      .then(openPage(SIGNIN_URL, selectors.SIGNIN.HEADER))
      .then(testElementExists(selectors.SIGNIN.HEADER))
      .then(fillOutSignIn(email, PASSWORD))
      .then(testErrorTextInclude('Primary account email required'))

      // sign in with new primary email
      .then(testElementExists(selectors.SIGNIN.HEADER))
      .then(fillOutSignIn(secondaryEmail, PASSWORD))

      // shows new primary email
      .then(testElementExists(selectors.SETTINGS.HEADER))
      .then(testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, secondaryEmail));
  },

  'can change primary email, change password and login': function () {
    return this.remote
      // change password
      .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))
      .then(fillOutChangePassword(PASSWORD, NEW_PASSWORD))

      // sign out and fails login with old password
      .then(click(selectors.SETTINGS.SIGNOUT))
      .then(testElementExists(selectors.SIGNIN.HEADER))
      .then(fillOutSignIn(secondaryEmail, PASSWORD))
      .then(visibleByQSA(selectors.SIGNIN.TOOLTIP))

      // sign in with new password
      .then(fillOutSignIn(secondaryEmail, NEW_PASSWORD))
      .then(testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, secondaryEmail));
  },

  'can change primary email, reset password and login': function () {
    return this.remote
      .then(click(selectors.SETTINGS.SIGNOUT))
      .then(testElementExists(selectors.SIGNIN.HEADER))

      // reset password
      .then(fillOutResetPassword(secondaryEmail))
      .then(testElementExists(selectors.CONFIRM_RESET_PASSWORD.HEADER))
      .then(openVerificationLinkInNewTab(secondaryEmail, 2))

      // complete the reset password in the new tab
      .then(switchToWindow(1))
        .then(testElementExists(selectors.COMPLETE_RESET_PASSWORD.HEADER))
        .then(fillOutCompleteResetPassword(NEW_PASSWORD, NEW_PASSWORD))

        .then(testElementExists(selectors.SETTINGS.HEADER))
        .then(testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, secondaryEmail))

        // sign out and fails login with old password
        .then(click(selectors.SETTINGS.SIGNOUT))
        .then(testElementExists(selectors.SIGNIN.HEADER))
        .then(fillOutSignIn(secondaryEmail, PASSWORD))
        .then(visibleByQSA(selectors.SIGNIN.TOOLTIP))

        // sign in with new password succeeds
        .then(fillOutSignIn(secondaryEmail, NEW_PASSWORD))
        .then(testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, secondaryEmail))
      .then(closeCurrentWindow());
  },

  'can change primary email, change password, login, change email and login': function () {
    return this.remote
    // change password
      .then(click(selectors.CHANGE_PASSWORD.MENU_BUTTON))
      .then(fillOutChangePassword(PASSWORD, NEW_PASSWORD))

      // sign out and fails login with old password
      .then(click(selectors.SETTINGS.SIGNOUT))
      .then(testElementExists(selectors.SIGNIN.HEADER))
      .then(fillOutSignIn(secondaryEmail, PASSWORD))
      .then(visibleByQSA(selectors.SIGNIN.TOOLTIP))

      // sign in with new password
      .then(openPage(SIGNIN_URL, selectors.SIGNIN.HEADER))
      .then(fillOutSignIn(secondaryEmail, NEW_PASSWORD))
      .then(testElementTextEquals(selectors.SETTINGS.PROFILE_HEADER, secondaryEmail))

      // set primary email to original email
      .then(click(selectors.EMAIL.MENU_BUTTON ))
      .then(testElementTextEquals(selectors.EMAIL.ADDRESS_LABEL, email))
      .then(testElementExists(selectors.EMAIL.VERIFIED_LABEL))
      .then(click(selectors.EMAIL.SET_PRIMARY_EMAIL_BUTTON))

      // sign out and login with new password
      .then(click(selectors.SETTINGS.SIGNOUT))
      .then(testElementExists(selectors.SIGNIN.HEADER))
      .then(fillOutSignIn(email, NEW_PASSWORD))
      .then(testElementExists(selectors.SETTINGS.HEADER));
  }
});