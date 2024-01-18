const saved = document.getElementById("saved")
let timeout = -1
function showSaved() {
  saved.style.setProperty("visibility", "visible")
  clearTimeout(timeout)
  timeout = setTimeout(
    () => saved.style.setProperty("visibility", "hidden"),
    1000,
  )
}

const searchSite    = document.getElementById("searchSite")
const searchParam   = document.getElementById("searchParam")
const configureSite = document.getElementById("configureSite")
configureSite.addEventListener("input", () => {
  // Given a set of search params, search for a specific value and return its
  // key.
  function find(searchParams, searchValue) {
    for (const [key, value] of searchParams) {
      if (value === searchValue)
        return key
    }
    return null
  }

  try {
    let url = new URL(configureSite.value)
    searchSite.value = url.origin + url.pathname
    searchParam.value = find(url.searchParams, "SEARCH")
  } catch (e) { return }
})

function formData2Obj(formData) {
  let settings = []
  formData.forEach((value, key) => settings.push([key, value]))
  return { settings }
}

function applyData2Form(data) {
  if (!Object.prototype.hasOwnProperty.call(data, "settings")) return
  data.settings.forEach(setting => {
    const keyQuery = `[name="${setting[0]}"]`
    const valQuery = `[value="${setting[1]}"]`
    let element = 
      document.querySelector(keyQuery + valQuery)
      || document.querySelector(keyQuery)

    if (!element) throw Error("couldn't find elem with name " + setting[0])
    if (element.type == "checkbox")
      element.checked = true
    else
      element.value = setting[1]
  })
}

function saveOptions(e) {
  e.preventDefault()
  const formData = new FormData(e.target)
  chrome.storage.sync.set(formData2Obj(formData))
  showSaved()
}

function restoreOptions() {
  // FIXME: The `chrome.storage.sync.get` API is callback based in v2 and
  // promise based in v3. Remove this note and exclusively use the promise API
  // when the Firefox version switches to v3 as well.
  if (chrome.runtime.getManifest().manifest_version == 3)
    chrome.storage.sync.get("settings").then(applyData2Form, console.error)
  else
    chrome.storage.sync.get("settings", applyData2Form)
}

document.addEventListener("DOMContentLoaded", restoreOptions)
document.querySelector("form").addEventListener("submit", saveOptions)

