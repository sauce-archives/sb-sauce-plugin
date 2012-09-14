// Init namespace.
var sauce = {};

// Strings
// en-US
var m = builder.translate.locales['en-US'].mapping;
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

sauce.getCredentials = function() {
  return {
    username:
      (bridge.prefManager.prefHasUserValue("extensions.seleniumbuilder.plugins.sauce.username") ? bridge.prefManager.getCharPref("extensions.seleniumbuilder.plugins.sauce.username") : ""),
    accesskey:
      (bridge.prefManager.prefHasUserValue("extensions.seleniumbuilder.plugins.sauce.accesskey") ? bridge.prefManager.getCharPref("extensions.seleniumbuilder.plugins.sauce.accesskey") : "")
  };
};

sauce.setCredentials = function(username, accesskey) {
  bridge.prefManager.setCharPref("extensions.seleniumbuilder.plugins.sauce.username", username);
  bridge.prefManager.setCharPref("extensions.seleniumbuilder.plugins.sauce.accesskey", accesskey);
};

sauce.getBrowser = function() {
  return bridge.prefManager.prefHasUserValue("extensions.seleniumbuilder.plugins.sauce.browser") ? bridge.prefManager.getCharPref("extensions.seleniumbuilder.plugins.sauce.browser") : "";
};

sauce.setBrowser = function(browser) {
  bridge.prefManager.setCharPref("extensions.seleniumbuilder.plugins.sauce.browser", browser);
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

sauce.settingspanel.show = function(callback) {
  if (sauce.settingspanel.dialog) { return; }
  jQuery('#edit-rc-connecting').show();
  jQuery.ajax(
    "http://saucelabs.com/rest/v1/info/browsers/webdriver",
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
              sauce.setBrowser(sauce.browserOptionName(browser));
              sauce.setAutoShowJobPage(!!jQuery('#sauce-showjobpage').attr('checked'));
              sauce.settingspanel.hide();
              if (callback) {
                callback({
                  'username': username,
                  'accesskey': accesskey,
                  'browserstring': browser.api_name,
                  'browserversion': browser.short_version,
                  'platform': browser.os
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
        var defaultName = sauce.getBrowser();
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

builder.gui.menu.addItem('file', _t('__sauce_settings'), 'file-sauce-settings', sauce.settingspanel.show);

builder.gui.menu.addItem('run', _t('__sauce_run_ondemand'), 'run-sauce-ondemand', function() {
  jQuery('#edit-rc-connecting').show();
  sauce.settingspanel.show(function(result) {
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
                  window.open("https://saucelabs.com/jobs/" + response.sessionId,'_newtab');
                } else {
                  var lnk = newNode('div', {'class': 'dialog', 'style': 'padding-top: 30px;'},
                    newNode('a', {'href': "https://saucelabs.com/jobs/" + response.sessionId, 'target': '_newtab'}, "Show job info")
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

builder.suite.addScriptChangeListener(function() {
  var script = builder.getScript();
  if (script && script.seleniumVersion === builder.selenium2) {
    jQuery('#run-sauce-ondemand').show();
  } else {
    jQuery('#run-sauce-ondemand').hide();
  }
});

// Add a Java exporter that talks to the Sauce infrastructure.
// Shallow copy and modify the existing Java formatter.
var exporter_info = {};
for (var k in builder.selenium2.io.formats.java_info) {
  exporter_info[k] = builder.selenium2.io.formats.java_info[k];
}

exporter_info.name = "Java/Sauce On Demand";

exporter_info.get_params = function(script, callback) { sauce.settingspanel.show(callback); };

exporter_info.start = 
  "import java.util.concurrent.TimeUnit;\n" +
  "import java.util.Date;\n" + 
  "import java.io.File;\n" +
  "import java.net.URL;\n" +
  "import org.openqa.selenium.support.ui.Select;\n" +
  "import org.openqa.selenium.interactions.Actions;\n" +
  "import org.openqa.selenium.firefox.FirefoxDriver;\n" +
  "import org.openqa.selenium.*;\n" +
  "import org.openqa.selenium.remote.*;\n" +
  "import static org.openqa.selenium.OutputType.*;\n" +
  "\n" +
  "public class {name} {\n" +
  "    public static void main(String[] args) throws Exception {\n" +
  "        DesiredCapabilities caps = DesiredCapabilities.{browserstring}();\n" +
  "            caps.setCapability(\"name\", \"{name}\");\n" +
  "        RemoteWebDriver wd = new RemoteWebDriver(\n" +
  "            new URL(\"http://{username}:{accesskey}@ondemand.saucelabs.com:80/wd/hub\"),\n" +
  "            caps);\n" +
  "        wd.manage().timeouts().implicitlyWait(60, TimeUnit.SECONDS);\n";
  
exporter_info.end =
  "        wd.quit();\n" +
  "    }\n" +
  "}\n";

builder.selenium2.io.formats.push(builder.selenium2.io.createLangFormatter(exporter_info));