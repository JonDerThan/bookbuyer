import fs from "node:fs"
import webExt from "web-ext"
import JSZip from "jszip"

const MANIFEST   = "./src/manifest.json"
const MANIFEST_3 = "./src/manifest_v3.json"
const ADDON      = "./src/bookbuyer.js"
const USERSCRIPT = "./bookbuyer.user.js"
const SRC_DIR    = "./src/"
const BUILD_DIR  = "./build/"
const ARCHIVE    = "bookbuyer_v{}.zip"
const ARCHIVE_V3 = "bookbuyer_v{}_mv3.zip"

function replaceInFile(path, replaceFn) {
  let content = fs.readFileSync(path, { encoding: "utf-8" })
  content = replaceFn(content)
  fs.writeFileSync(path, content)
}

function updateVersionInUserscriptHeader(file, version) {
  function replaceFn(content) {
    const toReplace = /(^\/\/\s+@version\s+).+$/m
    return content.replace(toReplace, "$1" + version)
  }

  return replaceInFile(file, replaceFn)
}

function updateVersionInJson(file, version) {
  function replaceFn(content) {
    const toReplace = /(^\s*"version"\s*:\s*")[^"]*/m
    return content.replace(toReplace, "$1" + version)
  }

  return replaceInFile(file, replaceFn)
}

let version = null
function getVersion() {
  if (version) return version
  const content = fs.readFileSync("./package.json", { "encoding": "utf-8" })
  const pkg = JSON.parse(content)
  return pkg.version
}

// Opens the given extensionPath (a `.zip` file), replaces the manifest with
// the given manifest_v3, and saves the new extension.
function replaceManifest(extensionPath) {
  const newManifest = fs.readFileSync(MANIFEST_3)
  const archive     = BUILD_DIR + ARCHIVE_V3.replace("{}", getVersion())
  const zip         = fs.readFileSync(extensionPath)
  JSZip.loadAsync(zip).then((zip) => {
    zip.file("manifest.json", newManifest)
    console.log(`Creating archive ${archive}...`)
    zip
      .generateNodeStream({
        streamFiles       : true,
        compression       : "DEFLATE",
        compressionOptions: { level: 9 }
      })
      .pipe(fs.createWriteStream(archive))
  })
}

function main() {
  const version = getVersion()
  console.log("Updating version in userscript header...")
  updateVersionInUserscriptHeader(ADDON, version)
  console.log("Updating version in manifest...")
  updateVersionInJson(MANIFEST, version)
  console.log("Updating version in manifest v3...")
  updateVersionInJson(MANIFEST_3, version)
  console.log("Copying addon to userscript dest...")
  fs.copyFileSync(ADDON, USERSCRIPT)

  const archive = ARCHIVE.replace("{}", version)
  console.log(`Creating archive ${archive}...`)
  webExt.cmd.build(
    {
      sourceDir    : SRC_DIR,
      filename     : archive,
      artifactsDir : BUILD_DIR,
      overwriteDest: true,
      ignoreFiles : [ "manifest_v3.json" ],
    },
    { shouldExitProgram: false }
  ).then(res => replaceManifest(res.extensionPath))
}

main()

