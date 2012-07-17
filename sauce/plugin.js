// Init namespace.
var sauce = {};

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
            newNode('h3', "Sauce Settings"),
            newNode('table', {style: 'border: none;', id: 'rc-options-table'},
              newNode('tr',
                newNode('td', "Sauce Username "),
                newNode('td', newNode('input', {id: 'sauce-username', type: 'text', value: credentials.username}))
              ),
              newNode('tr',
                newNode('td', "Sauce Access Key "),
                newNode('td', newNode('input', {id: 'sauce-accesskey', type: 'text', value: credentials.accesskey}))
              ),
              newNode('tr',
                newNode('td', ""),
                newNode('td', newNode('a', {'href': 'http://saucelabs.com/account/key', 'target': '_blank'}, "(look up access key)"))
              ),
              newNode('tr',
                newNode('td', "Browser "),
                newNode('td', newNode('select', {'id': 'sauce-browser'}))
              )
            ),
            newNode('a', {'href': '#', 'class': 'button', 'id': 'sauce-ok', 'click': function() {
              var username = jQuery('#sauce-username').val();
              var accesskey = jQuery('#sauce-accesskey').val();
              var choice = jQuery('#sauce-browser').val();
              var browser = sauceBrowsers[choice];
              sauce.setCredentials(username, accesskey);
              sauce.setBrowser(sauce.browserOptionName(browser));
              sauce.settingspanel.hide();
              if (callback) {
                callback({
                  'username': username,
                  'accesskey': accesskey,
                  'browserstring': browser.api_name,
                  'browserversion': browser.long_version,
                  'platform': browser.os
                });
              }
            }}, "OK"),
            newNode('a', {'href': '#', 'class': 'button', 'id': 'sauce-cancel', 'click': function() {
              sauce.settingspanel.hide();
            }}, "Cancel")
          );
        builder.dialogs.show(sauce.settingspanel.dialog);
        // Populate dialog.
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
        alert("Unable to connect to the Sauce servers: " + errorThrown);
      }
    }
  );
};

sauce.browserOptionName = function(entry) {
  return entry.long_name + " " + entry.short_version + " on " + entry.os;
};

sauce.settingspanel.hide = function() {
  jQuery(sauce.settingspanel.dialog).remove();
  sauce.settingspanel.dialog = null;
};

builder.gui.menu.addItem('file', 'Sauce Settings', 'file-sauce-settings', sauce.settingspanel.show);

builder.gui.menu.addItem('run', 'Run on Sauce OnDemand', 'run-sauce-ondemand', function() {
  jQuery('#edit-rc-connecting').show();
  sauce.settingspanel.show(function(result) {
    jQuery.ajax(
      "http://" + result.username + ":" + result.accesskey + "@saucelabs.com/rest/v1/users/" + result.username + "/",
      {
        success: function(ajresult) {
          if (ajresult.minutes <= 0) {
            jQuery('#edit-rc-connecting').hide();
            alert("Your OnDemand account has run out of minutes.");
          } else {
            builder.selenium2.rcPlayback.run(
              result.username + ":" + result.accesskey + "@ondemand.saucelabs.com:80",
              result.browserstring,
              result.browserversion,
              result.platform
            );
          }
        },
        error: function(xhr, textStatus, errorThrown) {
          jQuery('#edit-rc-connecting').hide();
          alert("Unable to connect to OnDemand: " + errorThrown);
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