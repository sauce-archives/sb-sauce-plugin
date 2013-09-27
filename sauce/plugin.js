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
m.__sauce_browser_1 = "Sel 1 Browser";
m.__sauce_browser_2 = "Sel 2 Browser";
m.__sauce_auto_show_job = "Automatically show Sauce jobs page";
m.__sauce_connection_error = "Unable to connect to the Sauce servers: {0}";
m.__sauce_on_os = "on";
m.__sauce_run_ondemand = "Run on Sauce OnDemand";
m.__sauce_run_suite_ondemand = "Run suite on Sauce OnDemand";
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
m.__sauce_browser_1 = "Sel 1 Browser";
m.__sauce_browser_2 = "Sel 2 Browser";
m.__sauce_auto_show_job = "Automatisch Abspiel-Details zeigen";
m.__sauce_connection_error = "Verbindung zum Server fehlgeschlagen: {0}";
m.__sauce_on_os = "auf";
m.__sauce_run_ondemand = "Auf Sauce OnDemand abspielen";
m.__sauce_run_suite_ondemand = "Suite auf Sauce OnDemand abspielen";
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

sauce.getBrowserOptionPrefs = function(sel2) {
  var prefName = sel2 ? "extensions.seleniumbuilder.plugins.sauce.browserOptions_sel2" : "extensions.seleniumbuilder.plugins.sauce.browserOptions_sel1";
  try {
    return JSON.parse(bridge.prefManager.prefHasUserValue(prefName) ? bridge.prefManager.getCharPref(prefName) : "{}");
  } catch (e) {
    return {};
  }
};

sauce.setBrowserOptionPrefs = function(sel2, os, browser, version) {
  var prefs = sauce.getBrowserOptionPrefs(sel2);
  prefs.os = os;
  if (!prefs.browsers) { prefs.browsers = {}; }
  if (!prefs.browsers[os]) { prefs.browsers[os] = {name: browser, versions: {}}; }
  prefs.browsers[os].name = browser;
  prefs.browsers[os].versions[browser] = version;
  var prefName = sel2 ? "extensions.seleniumbuilder.plugins.sauce.browserOptions_sel2" : "extensions.seleniumbuilder.plugins.sauce.browserOptions_sel1";
  try {
    bridge.prefManager.setCharPref(prefName, JSON.stringify(prefs));
  } catch (e) { /* ignore */ }
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

sauce.settingspanel.show = function(sel1, sel2, callback) {
  if (sauce.settingspanel.dialog) { return; }
  jQuery('#edit-rc-connecting').show();
  jQuery.ajax(
    "http://saucelabs.com/rest/v1/info/browsers",
    {
      success: function(sauceBrowsers1) {
        jQuery.ajax(
          "http://saucelabs.com/rest/v1/info/browsers/webdriver",
          {
            success: function(sauceBrowsers2) {
              var sauceBrowsersTree1 = sauce.browserOptionTree(sauceBrowsers1);
              var sauceBrowsersTree2 = sauce.browserOptionTree(sauceBrowsers2);
              
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
                    newNode('tr', {'id': 'sauce-browser-1-tr'},
                      newNode('td', _t('__sauce_browser_1') + " "),
                      newNode('td',
                        newNode('select', {'id': 'sauce-os-1'}), " ",
                        newNode('select', {'id': 'sauce-browser-1'}), " ",
                        newNode('select', {'id': 'sauce-version-1'})
                      )
                    ),
                    newNode('tr', {'id': 'sauce-browser-2-tr'},
                      newNode('td', _t('__sauce_browser_2') + " "),
                      newNode('td',
                        newNode('select', {'id': 'sauce-os-2'}), " ",
                        newNode('select', {'id': 'sauce-browser-2'}), " ",
                        newNode('select', {'id': 'sauce-version-2'})
                      )
                    ),
                    newNode('tr',
                      newNode('td', {'colspan': 2}, newNode('input', {'type':'checkbox', 'id': 'sauce-showjobpage'}), _t('__sauce_auto_show_job'))
                    )
                  ),
                  newNode('a', {'href': '#', 'class': 'button', 'id': 'sauce-ok', 'click': function() {
                    var username = jQuery('#sauce-username').val();
                    var accesskey = jQuery('#sauce-accesskey').val();
                    var browser1 = sauce.getBrowserOptionChoice(sauceBrowsersTree1, jQuery("#sauce-os-1").val(), jQuery("#sauce-browser-1").val(), jQuery("#sauce-version-1").val());
                    var browser2 = sauce.getBrowserOptionChoice(sauceBrowsersTree2, jQuery("#sauce-os-2").val(), jQuery("#sauce-browser-2").val(), jQuery("#sauce-version-2").val());
                    sauce.setCredentials(username, accesskey);
                    if (browser1) { sauce.setBrowserOptionPrefs(false, jQuery("#sauce-os-1").val(), jQuery("#sauce-browser-1").val(), jQuery("#sauce-version-1").val()); }
                    if (browser2) { sauce.setBrowserOptionPrefs(true, jQuery("#sauce-os-2").val(), jQuery("#sauce-browser-2").val(), jQuery("#sauce-version-2").val()); }
                    sauce.setAutoShowJobPage(!!jQuery('#sauce-showjobpage').attr('checked'));
                    sauce.settingspanel.hide();
                    if (callback) {
                      callback({
                        'username': username,
                        'accesskey': accesskey,
                        'browserstring1': browser1 ? browser1.selenium_name : null,
                        'browserstring2': browser2 ? browser2.api_name : null,
                        'browserversion1': browser1 ? browser1.short_version : null,
                        'browserversion2': browser2 ? browser2.short_version : null,
                        'platform1': browser1 ? browser1.os : null,
                        'platform2': browser2 ? browser2.os : null
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
              if (sel1) {
                sauce.populateOSDropdown("sauce-os-1", sauceBrowsersTree1, sauce.getBrowserOptionPrefs(false));
                jQuery('#sauce-os-1').change(function() {
                  sauce.populateBrowserDropdown("sauce-browser-1", sauceBrowsersTree1, sauce.getBrowserOptionPrefs(false), jQuery("#sauce-os-1").val());
                  sauce.populateVersionDropdown("sauce-version-1", sauceBrowsersTree1, sauce.getBrowserOptionPrefs(false), jQuery("#sauce-os-1").val(), jQuery("#sauce-browser-1").val());
                });
                sauce.populateBrowserDropdown("sauce-browser-1", sauceBrowsersTree1, sauce.getBrowserOptionPrefs(false), jQuery("#sauce-os-1").val());
                jQuery('#sauce-browser-1').change(function() {
                  sauce.populateVersionDropdown("sauce-version-1", sauceBrowsersTree1, sauce.getBrowserOptionPrefs(false), jQuery("#sauce-os-1").val(), jQuery("#sauce-browser-1").val());
                });
                sauce.populateVersionDropdown("sauce-version-1", sauceBrowsersTree1, sauce.getBrowserOptionPrefs(false), jQuery("#sauce-os-1").val(), jQuery("#sauce-browser-1").val());
              } else {
                jQuery('#sauce-browser-1-tr').remove();
              }
              if (sel2) {
                sauce.populateOSDropdown("sauce-os-2", sauceBrowsersTree2, sauce.getBrowserOptionPrefs(true));
                jQuery('#sauce-os-2').change(function() {
                  sauce.populateBrowserDropdown("sauce-browser-2", sauceBrowsersTree2, sauce.getBrowserOptionPrefs(true), jQuery("#sauce-os-2").val());
                  sauce.populateVersionDropdown("sauce-version-2", sauceBrowsersTree2, sauce.getBrowserOptionPrefs(true), jQuery("#sauce-os-2").val(), jQuery("#sauce-browser-2").val());
                });
                sauce.populateBrowserDropdown("sauce-browser-2", sauceBrowsersTree2, sauce.getBrowserOptionPrefs(true), jQuery("#sauce-os-2").val());
                jQuery('#sauce-browser-2').change(function() {
                  sauce.populateVersionDropdown("sauce-version-2", sauceBrowsersTree2, sauce.getBrowserOptionPrefs(true), jQuery("#sauce-os-2").val(), jQuery("#sauce-browser-2").val());
                });
                sauce.populateVersionDropdown("sauce-version-2", sauceBrowsersTree2, sauce.getBrowserOptionPrefs(true), jQuery("#sauce-os-2").val(), jQuery("#sauce-browser-2").val());
              } else {
                jQuery('#sauce-browser-2-tr').remove();
              }
            },
            error: function(xhr, textStatus, errorThrown) {
              jQuery('#edit-rc-connecting').hide();
              alert(_t('__sauce_connection_error', errorThrown));
            }
          }
        );
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

sauce.browserOptionTree = function(entries) {
  var tree = {};
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (!tree[e.os]) {
      tree[e.os] = {
        name: e.os,
        browsers: {}
      };
    }
    if (!tree[e.os].browsers[e.long_name]) {
      tree[e.os].browsers[e.long_name] = {
        name: e.long_name,
        versions: {}
      };
    }
    if (!tree[e.os].browsers[e.long_name].versions[e.short_version]) {
      tree[e.os].browsers[e.long_name].versions[e.short_version] = {
        name: e.short_version,
        entry: e,
        id: i
      };
    }
  }
  return tree;
};

sauce.populateOSDropdown = function(id, tree, prefs) {
  var def = sauce.getDefaultOSChoice(prefs);
  jQuery('#' + id).html('');
  for (var k in tree) {
    if (k == def) {
      jQuery('#' + id).append(newNode("option", {value: k, selected: "1"}, k));
    } else {
      jQuery('#' + id).append(newNode("option", {value: k}, k));
    }
  }
};

sauce.populateBrowserDropdown = function(id, tree, prefs, os) {
  var def = sauce.getDefaultBrowserChoice(prefs, tree, os);
  jQuery('#' + id).html('');
  for (var k in tree[os].browsers) {
    if (k == def) {
      jQuery('#' + id).append(newNode("option", {value: k, selected: "1"}, k));
    } else {
      jQuery('#' + id).append(newNode("option", {value: k}, k));
    }
  }
};

sauce.populateVersionDropdown = function(id, tree, prefs, os, browser) {
  var def = sauce.getDefaultVersionChoice(prefs, tree, os, browser);
  jQuery('#' + id).html('');
  for (var k in tree[os].browsers[browser].versions) {
    if (k == def) {
      jQuery('#' + id).append(newNode("option", {value: k, selected: "1"}, k));
    } else {
      jQuery('#' + id).append(newNode("option", {value: k}, k));
    }
  }
};

sauce.getBrowserOptionChoice = function(tree, os, browser, version) {
  return tree[os] && tree[os].browsers[browser] && tree[os].browsers[browser].versions[version] ? tree[os].browsers[browser].versions[version].entry : null;
};

sauce.getDefaultOSChoice = function(prefs) {
  return prefs.os || "Linux";
};

sauce.getDefaultBrowserChoice = function(prefs, tree, os) {
  if (prefs.browsers && prefs.browsers[os]) { return prefs.browsers[os].name; }
  if (tree[os] && tree[os].browsers["Firefox"]) { return "Firefox"; }
  return null;
};

function padVersionString(s) {
  return s.split(".").map(function(n) { return new Array(100 - n.length).join("0") + n; }).join(".");
}

sauce.getDefaultVersionChoice = function(prefs, tree, os, browser) {
  if (prefs.browsers && prefs.browsers[os] && prefs.browsers[os].versions && prefs.browsers[os].versions[browser]) { return prefs.browsers[os].versions[browser]; }
  if (tree[os] && tree[os].browsers[browser]) {
    var v = null;
    for (var k in tree[os].browsers[browser].versions) {
      if (v == null || padVersionString(v) < padVersionString(k)) { v = k; }
    }
    return v;
  }
  return null;
};

sauce.settingspanel.hide = function() {
  jQuery(sauce.settingspanel.dialog).remove();
  sauce.settingspanel.dialog = null;
};

sauce.runSel1ScriptWithSettings = function(result, callback) {
  jQuery('#edit-rc-connecting').show();
  jQuery.ajax(
    "http://" + result.username + ":" + result.accesskey + "@saucelabs.com/rest/v1/users/" + result.username + "/",
    {
      success: function(ajresult) {
        jQuery('#edit-rc-connecting').hide();
        if (ajresult.minutes <= 0) {
          alert(_t('__sauce_account_exhausted'));
        } else {
          var name = _t('sel2_untitled_run');
          if (builder.getScript().path) {
            var name = builder.getScript().path.path.split("/");
            name = name[name.length - 1];
            name = name.split(".")[0];
          }
          name = "Selenium Builder " + result.browserstring1 + " " + (result.browserversion1 ? result.browserversion1 + " " : "") + (result.platform1 ? result.platform1 + " " : "") + name;
        
          builder.selenium1.rcPlayback.run(
            "ondemand.saucelabs.com:80",
            JSON.stringify({
              'username':        result.username,
              'access-key':      result.accesskey,
              'os':              result.platform1,
              'browser':         result.browserstring1,
              'browser-version': result.browserversion1,
              'name':            name
            }),
            // Postrun callback
            function (runResult) {
              var data = null;
              if (runResult.success || !runResult.errormessage) {
                data = {"passed": runResult.success};
              } else {
                data = {"passed": runResult.success, 'custom-data': {'playback-error': runResult.errormessage}};
              }
              jQuery.ajax("https://" + result.username + ":" + result.accesskey + "@saucelabs.com/rest/v1/" + result.username + '/jobs/' + sauce.currentSessionId, {
                "cache": true,
                "type": "PUT",
                "contentType": "application/json",
                "data": JSON.stringify(data)
              });
              if (callback) {
                callback(runResult);
              }
            },
            // Start job callback
            function(rcResponse) {
              var sessionId = rcResponse.substring(3);
              sauce.currentSessionId = sessionId;
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
};

sauce.runSel2ScriptWithSettings = function(result, callback) {
  jQuery('#edit-rc-connecting').show();
  jQuery.ajax(
    "http://" + result.username + ":" + result.accesskey + "@saucelabs.com/rest/v1/users/" + result.username + "/",
    {
      success: function(ajresult) {
        jQuery('#edit-rc-connecting').hide();
        if (ajresult.minutes <= 0) {
          alert(_t('__sauce_account_exhausted'));
        } else {
          builder.selenium2.rcPlayback.run(
            result.username + ":" + result.accesskey + "@ondemand.saucelabs.com:80",
            result.browserstring2,
            result.browserversion2,
            result.platform2,
            // Postrun callback
            function (runResult) {
              var data = null;
              if (runResult.success || !runResult.errormessage) {
                data = {"passed": runResult.success};
              } else {
                data = {"passed": runResult.success, 'custom-data': {'playback-error': runResult.errormessage}};
              }
              jQuery.ajax("https://" + result.username + ":" + result.accesskey + "@saucelabs.com/rest/v1/" + result.username + '/jobs/' + sauce.currentSessionId, {
                "cache": true,
                "type": "PUT",
                "contentType": "application/json",
                "data": JSON.stringify(data)
              });
              if (callback) {
                callback(runResult);
              }
            },
            // Start job callback
            function(response) {
              sauce.currentSessionId = response.sessionId;
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
};

builder.registerPostLoadHook(function() {  
  builder.gui.menu.addItem('file', _t('__sauce_settings'), 'file-sauce-settings', function() { sauce.settingspanel.show(true, true); });

  builder.gui.menu.addItem('run', _t('__sauce_run_ondemand'), 'run-sauce-ondemand', function() {
    jQuery('#edit-rc-connecting').show();
    sauce.settingspanel.show(/*sel1*/ false, /*sel2*/ true, function(result) {
      sauce.runSel2ScriptWithSettings(result);
    });
  });

  builder.gui.menu.addItem('run', _t('__sauce_run_ondemand'), 'run-sauce-ondemand-sel1', function() {
    jQuery('#edit-rc-connecting').show();
    sauce.settingspanel.show(/* sel1 */ true, /*sel1*/ false, function(result) {
      sauce.runSel1ScriptWithSettings(result);
    });
  });
  
  builder.gui.menu.addItem('run', _t('__sauce_run_suite_ondemand'), 'run-suite-ondemand', function() {
    // Figure out which settings panels need showing.
    var needs1 = false;
    var needs2 = false;
    for (var i = 0; i < builder.suite.scripts.length; i++) {
      if (builder.suite.scripts[i].seleniumVersion == builder.selenium1) {
        needs1 = true;
      } else {
        needs2 = true;
      }
    }
    jQuery('#edit-rc-connecting').show();
    sauce.settingspanel.show(/* sel1 */ needs1, /* sel2*/ needs2, function(result) {
      sauce.runall.run(result);
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
    get_params: function(script, callback) { sauce.settingspanel.show(/* sel1 */ false, /* sel2 */ true, function(response) {
      if (response.browserstring2 == "internet explorer") {
        response.browserstring2 = "internetExplorer";
      }
      callback(response);
    }); },
    extraImports:
      "import java.net.URL;\n" +
      "import org.openqa.selenium.remote.DesiredCapabilities;\n" +
      "import org.openqa.selenium.remote.RemoteWebDriver;\n",
    driverVar:
      "RemoteWebDriver wd;",
    initDriver:
      "DesiredCapabilities caps = DesiredCapabilities.{browserstring2}();\n" +
      "            caps.setCapability(\"name\", \"{scriptName}\");\n" +
      "        wd = new RemoteWebDriver(\n" +
      "            new URL(\"http://{username}:{accesskey}@ondemand.saucelabs.com:80/wd/hub\"),\n" +
      "            caps);",
    junit_import_extra:
      "import com.saucelabs.common.SauceOnDemandAuthentication;\n" +
      "import com.saucelabs.common.SauceOnDemandSessionIdProvider;\n" +
      "import com.saucelabs.junit.SauceOnDemandTestWatcher;\n" +
      "import org.junit.Rule;\n" +
      "import org.junit.rules.TestName;\n",
    junit_class_extra: "implements SauceOnDemandSessionIdProvider ",
    junit_setup_extra: "        sessionId = wd.getSessionId().toString();\n",
    junit_fields_extra:
      "    private String sessionId;\n" +
      "    public SauceOnDemandAuthentication authentication = new SauceOnDemandAuthentication(\"{username}\", \"{accesskey}\");\n" +
      "    public @Rule SauceOnDemandTestWatcher resultReportingTestWatcher = new SauceOnDemandTestWatcher(this, authentication);\n" +
      "    public @Rule TestName testName = new TestName();\n" +
      "    @Override public String getSessionId() { return sessionId; }\n"
  });
};

for (var i = 0; i < to_add.length; i++) {
  createDerivedInfo(to_add[i]);
}

// Run suite feature
/**
 * Dialog that runs all scripts in the suite and keeps track of scripts being run.
 */
sauce.runall = {};
sauce.runall.dialog = null;

sauce.runall.currentScriptIndex = -1;
sauce.runall.scriptNames = [];

sauce.runall.info_p = null;
sauce.runall.scriptlist = null;
sauce.runall.stop_b = null;
sauce.runall.close_b = null;

sauce.runall.requestStop = false;
sauce.runall.currentPlayback = null;

sauce.runall.settings = null;

function makeViewResultLink(sid) {
  return newNode('a', {'class':"step-view", id:sid + "-view", style:"display: none", click: function(e) {
    window.bridge.getRecordingWindow().location = this.href;
    // We don't actually want the SB window to navigate to the script's page!
    e.preventDefault();
  }}, _t('view_run_result'));
}

sauce.runall.run = function(settings) {
  jQuery('#edit-suite-editing').hide();
  sauce.runall.requestStop = false;
  sauce.runall.settings = settings;
  
  sauce.runall.scriptNames = builder.suite.getScriptNames();
  
  sauce.runall.info_p = newNode('p', {id:'infop'}, _t('running_scripts'));
  
  // Display the scripts in a similar fashion to the steps are shown in the record interface.
  sauce.runall.scriptlist = newFragment();
  
  for (var i = 0; i < sauce.runall.scriptNames.length; i++) {
    var name = sauce.runall.scriptNames[i];
    var sid = 'script-num-' + i;

    sauce.runall.scriptlist.appendChild(
      newNode('div', {id: sid, 'class': 'b-suite-playback-script'},
        newNode('div',
          newNode('span', {}, name),
          makeViewResultLink(sid)
        ),
        newNode('div', {'class':"step-error", id:sid + "-error", style:"display: none"})
      )
    );
  }
  
  sauce.runall.stop_b = newNode('a', _t('stop'), {
    'class': 'button',
    click: function () {
      sauce.runall.stoprun();
    },
    href: '#stop'
  });
  
  sauce.runall.close_b = newNode('a', _t('close'), {
    'class': 'button',
    click: function () {
      jQuery(sauce.runall.dialog).remove();
    },
    href: '#close'
  });
  
  sauce.runall.dialog = newNode('div', {'class': 'dialog'});
  jQuery(sauce.runall.dialog)
    .append(sauce.runall.info_p)
    .append(sauce.runall.scriptlist)
    .append(newNode('p',
      newNode('span', {id: 'suite-playback-stop'}, sauce.runall.stop_b),
      newNode('span', {id: 'suite-playback-close', style: 'display: none;'}, sauce.runall.close_b)
    ));
    
  builder.dialogs.show(sauce.runall.dialog);
  
  sauce.runall.currentScriptIndex = -1; // Will get incremented to 0 in runNext.
  sauce.runall.runNext();
};

sauce.runall.stoprun = function() {
  sauce.runall.requestStop = true;
  jQuery('#suite-playback-stop').hide();
  try {
    sauce.runall.currentPlayback.stopTest();
  } catch (e) {
    // In case we haven't actually started or have already finished, we don't really care if this
    // goes wrong.
  }
};

sauce.runall.processResult = function(result) {
  if (result.url) {
    jQuery("#script-num-" + sauce.runall.currentScriptIndex + "-view").attr('href', result.url).show();
  }
  if (result.success) {
    jQuery("#script-num-" + sauce.runall.currentScriptIndex).css('background-color', '#bfee85');
  } else {
    if (result.errormessage) {
      jQuery("#script-num-" + sauce.runall.currentScriptIndex).css('background-color', '#ff3333');
      jQuery("#script-num-" + sauce.runall.currentScriptIndex + "-error").html(" " + result.errormessage).show();
    } else {
      jQuery("#script-num-" + sauce.runall.currentScriptIndex).css('background-color', '#ffcccc');
    }
  }
  sauce.runall.runNext();
};

sauce.runall.hide = function () {
  jQuery(sauce.runall.dialog).remove();
};

sauce.runall.runNext = function() {
  sauce.runall.currentScriptIndex++;
  if (sauce.runall.currentScriptIndex < sauce.runall.scriptNames.length &&
      !sauce.runall.requestStop)
  {
    jQuery("#script-num-" + sauce.runall.currentScriptIndex).css('background-color', '#ffffaa');
    builder.suite.switchToScript(sauce.runall.currentScriptIndex);
    builder.stepdisplay.update();
    sauce.runall.currentPlayback = builder.getScript().seleniumVersion.rcPlayback;
    if (builder.getScript().seleniumVersion == builder.selenium1) {
      sauce.runSel1ScriptWithSettings(sauce.runall.settings, sauce.runall.processResult);
    } else {
      sauce.runSel2ScriptWithSettings(sauce.runall.settings, sauce.runall.processResult);
    }
  } else {
    jQuery('#suite-playback-stop').hide();
    jQuery('#suite-playback-close').show();
    jQuery(sauce.runall.info_p).html(_t('done_exclamation'));
    jQuery('#edit-suite-editing').show();
  }
};