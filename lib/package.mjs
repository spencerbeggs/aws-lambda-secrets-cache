import fs from "fs-extra";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const relative = (str) => path.resolve(__dirname, str);

try {
  console.log("Packaging build.");
  let pkg = await fs.readJson(relative("../package.json"));
  pkg = Object.entries(pkg).reduce((acc, [key, value]) => {
    if (key === "module") {
      acc["main"] = value.replace("src/", "").replace(".ts", ".js");
      acc["types"] = value.replace("src/", "").replace(".ts", ".d.ts");
    } else if (!["devDependencies", "scripts", "type"].includes(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
  // TODO: Restore when typescript plugins is fixed
  //pkg.types = pkg.main.replace(".js", ".d.ts");
  await fs.writeJson(relative("../dist/package.json"), pkg, { spaces: "\t" });
  await fs.copy(relative("../.npmignore"), relative("../dist/.npmignore"));
  await fs.copy(relative("../README.md"), relative("../dist/README.md"));
  await fs.copy(relative("../LICENSE"), relative("../dist/LICENSE"));
  console.log("Packaged successfully.");
} catch (err) {
  console.log(err);
}
