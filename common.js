alert("loading!");
try {
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
  alert("LOADED!");
} catch (e) {
  alert(e);
}