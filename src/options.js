const savedElem = document.getElementById("saved")
let   timeoutId = -1
/**
 * Indicate to the user that the settings were saved by making a specific HTML
 * element visible for 1s.
 */
function showSaved() {
  function makeVisible(vis) {
    savedElem.style.setProperty("visibility", vis ? "visible" : "hidden")
  }
  makeVisible(true)
  clearTimeout(timeoutId)
  timeoutId = setTimeout(() => makeVisible(false), 1000)
}

const configureSiteElem = document.getElementById("configureSite")
const searchSiteElem    = document.getElementById("searchSite")
const searchParamElem   = document.getElementById("searchParam")
/**
 * When the user inputs a site, extract the search URL and parameter and input
 * them in the respective HTML elements.
 */
configureSiteElem.addEventListener("input", () => {
  // Given a set of search params, search for a specific value and return its
  // key.
  function find(searchParams, searchValue) {
    for (const [key, value] of searchParams) {
      if (value === searchValue)
        return key
    }
    return null
  }

  function indicateValidity(valid) {
    configureSiteElem.style.borderColor = valid ? "green" : "red"
  }

  try {
    let url = new URL(configureSiteElem.value)
    let param = find(url.searchParams, "SEARCH")
    if (!param) throw Error("invalid site")
    searchSiteElem.value  = url.origin + url.pathname
    searchParamElem.value = param
    indicateValidity(true)
  } catch (e) {
    indicateValidity(false)
  }
})

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

  if (isSiteConfigured(data)) indicateAlreadyConfigured()
}

/**
 * If the user has already configured the search site, indicate that by
 * removing the red border around the `Configure site` field and inserting a
 * placeholder.
 */
function indicateAlreadyConfigured() {
  configureSiteElem.style.borderColor = "#00000000" // transparent
  configureSiteElem.placeholder       = "Already configured!"
}

/**
 * Check if the `data` object has a correctly configured site.
 */
function isSiteConfigured(data) {
  if (!Object.prototype.hasOwnProperty.call(data, "settings")) return false

  let searchSite  = data.settings.find(setting => setting[0] === "search_site")
  let searchParam = data.settings.find(setting => setting[0] === "search_param")
  if (searchSite === undefined || searchParam === undefined) return false
  searchSite  = searchSite[1]
  searchParam = searchParam[1]
  if (searchSite.length === 0 || searchParam.length === 0) return false

  try       { new URL(`${searchSite}?${searchParam}=SEARCH`) }
  catch (_) { return false }
  return true
}

/** Given an iterator, collect the entries into an array. */
function collectIterator(iter) {
  let list = []
  for (const x of iter) {
    list.push(x)
  }
  return list
}

function saveOptions(e) {
  e.preventDefault()
  const formData = new FormData(e.target)
  const settings = collectIterator(formData.entries())
  chrome.storage.sync.set({ settings })
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

