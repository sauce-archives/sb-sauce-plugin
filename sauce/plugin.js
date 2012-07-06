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

sauce.settingspanel = {};
/** The dialog. */
sauce.settingspanel.dialog = null;

sauce.settingspanel.show = function(callback) {
  if (sauce.settingspanel.dialog) { return; }
  var credentials = sauce.getCredentials();
  sauce.settingspanel.dialog =
    newNode('div', {'class': 'dialog'},
      newNode('h3', "Sauce Settings"),
      newNode('ul',
        newNode('li',
          newNode('label', {'for': 'sauce-username'}, "Sauce Username"),
          newNode('input', {'name': 'sauce-username', 'id': 'sauce-username', 'value': credentials.username})
        ),
        newNode('li',
          newNode('label', {'for': 'sauce-accesskey'}, "Sauce Access Key"),
          newNode('input', {'name': 'sauce-accesskey', 'id': 'sauce-accesskey', 'value': credentials.accesskey})
        )
      ),
      newNode('a', {'href': '#', 'class': 'button', 'id': 'sauce-cancel', 'click': function() {
        sauce.settingspanel.hide();
      }}, "Cancel"),
      newNode('a', {'href': '#', 'class': 'button', 'id': 'sauce-ok', 'click': function() {
        var username = jQuery('#sauce-username').val();
        var accesskey = jQuery('#sauce-accesskey').val();
        sauce.setCredentials(username, accesskey);
        sauce.settingspanel.hide();
        if (callback) {
          callback({'username': username, 'accesskey': accesskey});
        }
      }}, "OK")
    );
  builder.dialogs.show(sauce.settingspanel.dialog);
};

sauce.settingspanel.hide = function() {
  jQuery(sauce.settingspanel.dialog).remove();
  sauce.settingspanel.dialog = null;
};

builder.gui.menu.addItem('file', 'Sauce Settings', sauce.settingspanel.show);

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
  "        DesiredCapabilities caps = DesiredCapabilities.firefox();\n" +
  "            caps.setCapability(\"version\", \"5\");\n" +
  "            caps.setCapability(\"platform\", Platform.XP);\n" +
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