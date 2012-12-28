// Init namespace.
var sauce = {};

// Strings
// en
var m = builder.translate.locales['en'].mapping;
m.__sauce_settings = "Sauce Settings";
m.__sauce_username = "Sauce Username";
m.__sauce_access_key = "Sauce Access Key";
m.__sauce_lookup_access_key = "look up access key";
m.__sauce_get_account = "Don't have an account? Get one for free!";
m.__sauce_browser = "Browser";
m.__sauce_auto_show_job = "Automatically show Sauce jobs page";
m.__sauce_connection_error = "Unable to connect to the Sauce servers: {0}";
m.__sauce_on_os = "on";
m.__sauce_run_ondemand = "Run on Sauce OnDemand";
m.__sauce_account_exhausted = "Your OnDemand account has run out of minutes.";
m.__sauce_ondemand_connection_error = "Unable to connect to OnDemand: {0}";
// de
m = builder.translate.locales['de'].mapping;
m.__sauce_settings = "Sauce: Einstellungen";
m.__sauce_username = "Sauce: Benutzername";
m.__sauce_access_key = "Sauce: Access Key";
m.__sauce_lookup_access_key = "Access Key abrufen ";
m.__sauce_get_account = "Gratis bei Sauce anmelden!";
m.__sauce_browser = "Browser";
m.__sauce_auto_show_job = "Automatisch Abspiel-Details zeigen";
m.__sauce_connection_error = "Verbindung zum Server fehlgeschlagen: {0}";
m.__sauce_on_os = "auf";
m.__sauce_run_ondemand = "Auf Sauce OnDemand abspielen";
m.__sauce_account_exhausted = "Das OnDemand-Konto hat keine Minuten übrig.";
m.__sauce_ondemand_connection_error = "Verbindung zum Server fehlgeschlagen: {0}";

sauce.shutdown = function() {

};

sauce.loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);

sauce.loginInfo = new Components.Constructor(
  "@mozilla.org/login-manager/loginInfo;1",
  Components.interfaces.nsILoginInfo,
  "init"
);

sauce.getCredentials = function() {
  // Migrate to new credentials storage system.
  var creds = sauce.getOldCredentials();
  if (creds.username && creds.accesskey) {
    sauce.setCredentials(creds.username, creds.accesskey);
    sauce.setOldCredentials("", "");
    return creds;
  }
  
  var logins = sauce.loginManager.findLogins(
    {},
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'Sauce User Login'
  );
  
  for (var i = 0; i < logins.length; i++) {
    return {'username': logins[i].username, 'accesskey': logins[i].password};
  }
  return {'username': "", 'accesskey': ""};
};

sauce.setCredentials = function(username, accesskey) {
  var logins = sauce.loginManager.findLogins(
    {},
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'Sauce User Login'
  );
  
  for (var i = 0; i < logins.length; i++) {
    sauce.loginManager.removeLogin(logins[i]);
  }
  
  var loginInfo = new sauce.loginInfo(
    /*hostname*/      'chrome://seleniumbuilder',
    /*formSubmitURL*/ null,
    /*httprealm*/     'Sauce User Login',
    /*username*/      username,
    /*password*/      accesskey,
    /*usernameField*/ "",
    /*passwordField*/ ""
  );
  sauce.loginManager.addLogin(loginInfo);
};

sauce.getOldCredentials = function() {
  return {
    username:
      (bridge.prefManager.prefHasUserValue("extensions.seleniumbuilder.plugins.sauce.username") ? bridge.prefManager.getCharPref("extensions.seleniumbuilder.plugins.sauce.username") : ""),
    accesskey:
      (bridge.prefManager.prefHasUserValue("extensions.seleniumbuilder.plugins.sauce.accesskey") ? bridge.prefManager.getCharPref("extensions.seleniumbuilder.plugins.sauce.accesskey") : "")
  };
};

sauce.setOldCredentials = function(username, accesskey) {
  bridge.prefManager.setCharPref("extensions.seleniumbuilder.plugins.sauce.username", username);
  bridge.prefManager.setCharPref("extensions.seleniumbuilder.plugins.sauce.accesskey", accesskey);
};

sauce.getBrowser = function(sel1) {
  var prefName = sel1 ? "extensions.seleniumbuilder.plugins.sauce.browser_sel1" : "extensions.seleniumbuilder.plugins.sauce.browser";
  return bridge.prefManager.prefHasUserValue(prefName) ? bridge.prefManager.getCharPref(prefName) : "";
};

sauce.setBrowser = function(browser, sel1) {
    var prefName = sel1 ? "extensions.seleniumbuilder.plugins.sauce.browser_sel1" : "extensions.seleniumbuilder.plugins.sauce.browser";
  bridge.prefManager.setCharPref(prefName, browser);
};

sauce.getAutoShowJobPage = function() {
  return bridge.prefManager.prefHasUserValue("extensions.seleniumbuilder.plugins.sauce.autoshowjobpage") ? bridge.prefManager.getBoolPref("extensions.seleniumbuilder.plugins.sauce.autoshowjobpage") : true;
};

sauce.setAutoShowJobPage = function(asjp) {
  bridge.prefManager.setBoolPref("extensions.seleniumbuilder.plugins.sauce.autoshowjobpage", asjp);
};

sauce.settingspanel = {};
/** The dialog. */
sauce.settingspanel.dialog = null;

sauce.settingspanel.show = function(sel1, callback) {
  if (sauce.settingspanel.dialog) { return; }
  jQuery('#edit-rc-connecting').show();
  jQuery.ajax(
    sel1 ? "http://saucelabs.com/rest/v1/info/browsers" : "http://saucelabs.com/rest/v1/info/browsers/webdriver",
    {
      success: function(sauceBrowsers) {
        jQuery('#edit-rc-connecting').hide();
        var credentials = sauce.getCredentials();
        sauce.settingspanel.dialog =
          newNode('div', {'class': 'dialog'},
            newNode('h3', _t('__sauce_settings')),
            newNode('table', {style: 'border: none;', id: 'rc-options-table'},
              newNode('tr',
                newNode('td', _t('__sauce_username') + " "),
                newNode('td', newNode('input', {id: 'sauce-username', type: 'text', value: credentials.username, 'change': function() {
                  if (jQuery('#sauce-username').val() == "") {
                    jQuery('#sauce-account-link').show();
                  } else {
                    jQuery('#sauce-account-link').hide();
                  }
                }}))
              ),
              newNode('tr',
                newNode('td', _t('__sauce_access_key') + " "),
                newNode('td', newNode('input', {id: 'sauce-accesskey', type: 'text', value: credentials.accesskey}))
              ),
              newNode('tr',
                newNode('td', ""),
                newNode('td', newNode('a', {'href': 'http://saucelabs.com/account/key', 'target': '_blank'}, "(" + _t('__sauce_lookup_access_key') + ")"))
              ),
              newNode('tr', {'id': 'sauce-account-link'},
                newNode('td', ""),
                newNode('td', newNode('a', {'href': 'http://saucelabs.com/signup', 'target': '_blank'}, "(" + _t('__sauce_get_account') + ")"))
              ),
              newNode('tr',
                newNode('td', _t('__sauce_browser') + " "),
                newNode('td', newNode('select', {'id': 'sauce-browser'}))
              ),
              newNode('tr',
                newNode('td', {'colspan': 2}, newNode('input', {'type':'checkbox', 'id': 'sauce-showjobpage'}), _t('__sauce_auto_show_job'))
              )
            ),
            newNode('a', {'href': '#', 'class': 'button', 'id': 'sauce-ok', 'click': function() {
              var username = jQuery('#sauce-username').val();
              var accesskey = jQuery('#sauce-accesskey').val();
              var choice = jQuery('#sauce-browser').val();
              var browser = sauceBrowsers[choice];
              sauce.setCredentials(username, accesskey);
              sauce.setBrowser(sauce.browserOptionName(browser), sel1);
              sauce.setAutoShowJobPage(!!jQuery('#sauce-showjobpage').attr('checked'));
              sauce.settingspanel.hide();
              if (callback) {
                callback({
                  'username': username,
                  'accesskey': accesskey,
                  'browserstring': sel1 ? browser.selenium_name : browser.api_name,
                  'browserversion': browser.short_version,
                  'platform': browser.os,
                  'sel1': sel1 || false
                });
              }
            }}, _t('ok')),
            newNode('a', {'href': '#', 'class': 'button', 'id': 'sauce-cancel', 'click': function() {
              sauce.settingspanel.hide();
            }}, _t('cancel'))
          );
        builder.dialogs.show(sauce.settingspanel.dialog);
        if (sauce.getAutoShowJobPage()) {
          jQuery('#sauce-showjobpage').attr('checked', 'checked');
        }
        // Populate dialog.
        if (credentials.username != "") {
          jQuery('#sauce-account-link').hide();
        }
        var usedNames = {};
        var defaultName = sauce.getBrowser(sel1);
        for (var i = 0; i < sauceBrowsers.length; i++) {
          var name = sauce.browserOptionName(sauceBrowsers[i]);
          if (usedNames[name]) { continue; }
          usedNames[name] = true;
          if (name == defaultName) {
            jQuery('#sauce-browser').append(newNode(
              'option',
              {'value': i, 'selected': 'selected'},
              name
            ));
          } else {
            jQuery('#sauce-browser').append(newNode(
              'option',
              {'value': i},
              name
            ));
          }
        }
      },
      error: function(xhr, textStatus, errorThrown) {
        jQuery('#edit-rc-connecting').hide();
        alert(_t('__sauce_connection_error', errorThrown));
      }
    }
  );
};

sauce.browserOptionName = function(entry) {
  return entry.long_name + " " + entry.short_version + " " + _t('__sauce_on_os') + " " + entry.os;
};

sauce.settingspanel.hide = function() {
  jQuery(sauce.settingspanel.dialog).remove();
  sauce.settingspanel.dialog = null;
};

builder.registerPostLoadHook(function() {  
  builder.gui.menu.addItem('file', _t('__sauce_settings'), 'file-sauce-settings', sauce.settingspanel.show);

  builder.gui.menu.addItem('run', _t('__sauce_run_ondemand'), 'run-sauce-ondemand', function() {
    jQuery('#edit-rc-connecting').show();
    sauce.settingspanel.show(/*sel1*/ false, function(result) {
      jQuery.ajax(
        "http://" + result.username + ":" + result.accesskey + "@saucelabs.com/rest/v1/users/" + result.username + "/",
        {
          success: function(ajresult) {
            if (ajresult.minutes <= 0) {
              jQuery('#edit-rc-connecting').hide();
              alert(_t('__sauce_account_exhausted'));
            } else {
              builder.selenium2.rcPlayback.run(
                result.username + ":" + result.accesskey + "@ondemand.saucelabs.com:80",
                result.browserstring,
                result.browserversion,
                result.platform,
                null,
                // Start job callback
                function(response) {
                  if (sauce.getAutoShowJobPage()) {
                    window.open("http://saucelabs.com/jobs/" + response.sessionId,'_newtab');
                  } else {
                    var lnk = newNode('div', {'class': 'dialog', 'style': 'padding-top: 30px;'},
                      newNode('a', {'href': "http://saucelabs.com/jobs/" + response.sessionId, 'target': '_newtab'}, "Show job info")
                    );
                    builder.dialogs.show(lnk);
                    var hide = function() { jQuery(lnk).remove(); builder.views.script.removeClearResultsListener(hide); };
                    builder.views.script.addClearResultsListener(hide);
                  }
                }
              );
            }
          },
          error: function(xhr, textStatus, errorThrown) {
            jQuery('#edit-rc-connecting').hide();
            alert(_t('__sauce_ondemand_connection_error', errorThrown));
          }
        }
      );
    });
  });

  builder.gui.menu.addItem('run', _t('__sauce_run_ondemand'), 'run-sauce-ondemand-sel1', function() {
    jQuery('#edit-rc-connecting').show();
    sauce.settingspanel.show(/* sel1 */ true, function(result) {
      jQuery.ajax(
        "http://" + result.username + ":" + result.accesskey + "@saucelabs.com/rest/v1/users/" + result.username + "/",
        {
          success: function(ajresult) {
            if (ajresult.minutes <= 0) {
              jQuery('#edit-rc-connecting').hide();
              alert(_t('__sauce_account_exhausted'));
            } else {
              var name = _t('sel2_untitled_run');
              if (builder.getScript().path) {
                var name = builder.getScript().path.path.split("/");
                name = name[name.length - 1];
                name = name.split(".")[0];
              }
              name = "Selenium Builder " + result.browserstring + " " + (result.browserversion ? result.browserversion + " " : "") + (result.platform ? result.platform + " " : "") + name;
            
              builder.selenium1.rcPlayback.run(
                "ondemand.saucelabs.com:80",
                JSON.stringify({
                  'username':        result.username,
                  'access-key':      result.accesskey,
                  'os':              result.platform,
                  'browser':         result.browserstring,
                  'browser-version': result.browserversion,
                  'name':            name
                }),
                null,
                // Start job callback
                function(rcResponse) {
                  var sessionId = rcResponse.substring(3);
                  if (sauce.getAutoShowJobPage()) {
                    window.open("http://saucelabs.com/tests/" + sessionId,'_newtab');
                  } else {
                    var lnk = newNode('div', {'class': 'dialog', 'style': 'padding-top: 30px;'},
                      newNode('a', {'href': "http://saucelabs.com/jobs/" + sessionId, 'target': '_newtab'}, "Show job info")
                    );
                    builder.dialogs.show(lnk);
                    var hide = function() { jQuery(lnk).remove(); builder.views.script.removeClearResultsListener(hide); };
                    builder.views.script.addClearResultsListener(hide);
                  }
                }
              );
            }
          },
          error: function(xhr, textStatus, errorThrown) {
            jQuery('#edit-rc-connecting').hide();
            alert(_t('__sauce_ondemand_connection_error', errorThrown));
          }
        }
      );
    });
  });
});

builder.suite.addScriptChangeListener(function() {
  var script = builder.getScript();
  if (script && script.seleniumVersion === builder.selenium2) {
    jQuery('#run-sauce-ondemand').show();
    jQuery('#run-sauce-ondemand-sel1').hide();
  } else {
    jQuery('#run-sauce-ondemand').hide();
    jQuery('#run-sauce-ondemand-sel1').show();
  }
});

// Add Java exporters that talk to the Sauce infrastructure.
var to_add = [];
for (var name in builder.selenium2.io.lang_infos) {
  if (name.startsWith && name.startsWith("Java")) {
    to_add.push(name);
  }
}

function createDerivedInfo(name) {
  builder.selenium2.io.addDerivedLangFormatter(name, {
    name: name + "/Sauce On Demand",
    get_params: function(script, callback) { sauce.settingspanel.show(/* sel1 */ false, callback); },
    extraImports:
      "import java.net.URL;\n" +
      "import org.openqa.selenium.remote.DesiredCapabilities;\n" +
      "import org.openqa.selenium.remote.RemoteWebDriver;\n",
    driverVar:
      "RemoteWebDriver wd;",
    initDriver:
      "DesiredCapabilities caps = DesiredCapabilities.{browserstring}();\n" +
      "    caps.setCapability(\"name\", \"{name}\");\n" +
      "wd = new RemoteWebDriver(\n" +
      "    new URL(\"http://{username}:{accesskey}@ondemand.saucelabs.com:80/wd/hub\"),\n" +
      "    caps);"
  });
};

for (var i = 0; i < to_add.length; i++) {
  createDerivedInfo(to_add[i]);
}