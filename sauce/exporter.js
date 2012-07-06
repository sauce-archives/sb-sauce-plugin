/**
 * Adds a Java exporter that talks to the Sauce infrastructure.
 */

var exporter_info = builder.selenium2.io.formats.java_info.clone();

exporter_info.name = "Java/Sauce On Demand";
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
  "    public static void main(String[] args) {\n" +
  "        DesiredCapabilities caps = DesiredCapabilities.firefox();\n" +
  "            caps.setCapability(\"version\", \"5\");\n" +
  "            caps.setCapability(\"platform\", Platform.XP);\n" +
  "            caps.setCapability(\"name\", \"{name}\");\n" +
  "        RemoteWebDriver wd = new RemoteWebDriver(\n" +
  "            new URL(\"http://{username}:{accesskey}@ondemand.saucelabs.com:80/wd/hub\"),\n" +
  "            caps);\n" +
  "        wd.manage().timeouts().implicitlyWait(60, TimeUnit.SECONDS);\n";

exporter_info.get_params = sauce.settingspanel.show;

builder.selenium2.io.formats.push(builder.selenium2.io.createLangFormatter(exporter_info));