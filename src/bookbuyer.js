// ==UserScript==
// @name            BookBuyer
// @author          JonDerThan
// @namespace       JonDerThan.github.com
// @version         1.0.2
// @description     Allows for quick searching of goodread books on an arbitrary website.
// @match           https://www.goodreads.com/*
// @iconURL         https://raw.githubusercontent.com/JonDerThan/bookbuyer/main/src/bookbuyer-favicon.png
// @source          https://github.com/JonDerThan/bookbuyer
//
// ==/UserScript==
"use strict"

// Use any site that offers a search feature and search for `SEARCH`.
// Consider the example site https://www.amazon.com/s?k=SEARCH&browser=chrome&ref=nav_bar.
// The `SEARCH_SITE` variable is everything left to the `?`. With this example,
// this would be `https://www.amazon.com/s`. The `SEARCH_PARAM` variable is
// found before the `SEARCH`, in the example this would just be `k`.
let SEARCH_SITE = ""
let SEARCH_PARAM = ""
let inclAuthor = false
let searchParams = [
  // ["sort",    "newest"],
  // ["lang",    "en"],
  // ["lang",    "de"],
  // ["content", "book_nonfiction"],
  // ["content", "book_fiction"],
  // ["ext",     "epub"],
  // ["ext",     "pdf"],
]

let ICON_URL = "https://raw.githubusercontent.com/JonDerThan/bookbuyer/main/src/bookbuyer-favicon.png"
let SEARCH_HOSTNAME = ""
let pendingChecks = [-1, -1, -1, -1]

// Check whether the script is currently executed as an add-on.
function isAddon() {
  return typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined"
}

// Run as an add-on.
if (isAddon()) {
  ICON_URL = chrome.runtime.getURL("bookbuyer-favicon.png")
  // FIXME: Despite documentation saying otherwise, apparently Firefox supports
  // both the callback AND the promises API for the `chrome.storage.sync.get`
  // API, when run with manifest v2. As per the docs, with v2, only the
  // callback API should be supported. Since the Chrome version is run with v3
  // anyways (where the promises API is adopted), this works in both Firefox
  // and Chrome. Since the Firefox version should switch over to v3 soon, this
  // undocumented version is kept. Remove this note when manifest v3 is used
  // for the Firefox version too.
  // Note: Seemingly this only applies to content scripts. In the settings page
  // only the callback API is supported.
  chrome.storage.sync.get("settings")
    .then(data => {
      if (Object.prototype.hasOwnProperty.call(data, "settings")) {
        const settings = data.settings
        inclAuthor = settings.findIndex(s => s[0] == "incl_author") != -1
        SEARCH_SITE = settings.find(s => s[0] === "search_site")
        if (SEARCH_SITE) SEARCH_SITE = SEARCH_SITE[1]
        SEARCH_PARAM = settings.find(s => s[0] === "search_param")
        if (SEARCH_PARAM) SEARCH_PARAM = SEARCH_PARAM[1]
        searchParams = settings.filter(s => 
          s[0] != "incl_author"
            && s[0] !== "search_site"
            && s[0] !== "search_param"
            && s[0] != "lang"
            && s[1]
        )
        const lang = settings.find(s => s[0] == "lang")
        if (lang) searchParams.push(...lang[1]
          .split(",")
          .map(l => l.trim())
          .filter(l => l)
          .map(l => [ "lang", l ])
        )
      }

      main()
    })
    .catch(e => {
      console.error("error loading settings: " + e)
      main()
    })
}

// Run as a userscript.
else {
  main()
}

function getURL(search, author) {
  let httpGetList = searchParams
    .map(s => encodeURIComponent(s[0]) + "=" + encodeURIComponent(s[1]))
    .join("&")
  if (httpGetList.length > 0) httpGetList += "&"
  if (inclAuthor && author) search += " " + author
  httpGetList += SEARCH_PARAM + "=" + encodeURIComponent(search)
  return `${SEARCH_SITE}?${httpGetList}`
}

function findBookElems() {
  let bookElems = []

  // finds books on most pages, basically just gets the links to book pages
  let elems = document.querySelectorAll("a[href*='/book/show/']")
  for (let i = 0; i < elems.length; i++) {
    let elem = elems[i]
    let author = isBookElem(elem)
    if (author == null) continue
    bookElems.push([getTitle(elem), author, elem])
  }

  // find book title on books page - "book/show/"
  elems = document.getElementsByClassName("Text__title1")
  for (let i = 0; i < elems.length; i++) {
    if (elems[i].getAttribute("data-testid") !== "bookTitle") continue
    const title = elems[i].innerText
    let author = document
      .querySelector("a.ContributorLink[href*='/author/show/']")
    if (author) author = author.innerText
    else author = ""
    bookElems.push([title, author, elems[i]])
    break
  }

  return bookElems
}

// Returns `null` if elem isn't a book element, returns the authors name if it
// is. Can return `""` if the element is a book but no author was found.
function isBookElem(elem) {
  const BOOK_HREF_REGEX = /\/book\/show\/[^#]+$/
  const DONT_MATCH = /Continue reading/
  if (!BOOK_HREF_REGEX.test(elem.href)) return null
  if (!elem.innerText.length)           return null
  if (DONT_MATCH.test(elem.innerText))  return null

  let author = null
  while (elem) {
    if (elem.classList.contains("MoreEditions")) return null
    if (!author) author = getAuthorChild(elem)
    elem = elem.parentElement
  }

  return author || ""
}

// Given an element, search the children for a link to an author. Returns
// `null` if none was found, else returns the authors name.
function getAuthorChild(elem) {
  let a = elem.querySelector("a[href*='/author/show/']")
  if (a && a.innerText.length > 0)
    return a.innerText
  else
    return null
}

// Get the title to of the book element. Only return the title and exclude the
// series this book belongs to e.g. "(Harry Potter, #5)".
function getTitle(elem) {
  const TITLE = /^(.+?)(?: \(.+, #\d+(?:-\d+)?\))?$/
  const matches = elem.innerText.match(TITLE)

  return matches[1]
}

function createLink(title, author) {
  // create img
  let img = document.createElement("img")
  img.setAttribute("src", ICON_URL)
  let alt = `Search for "${title}" on ${SEARCH_HOSTNAME}`
  img.setAttribute("alt",   alt)
  img.setAttribute("title", alt)

  // create a
  const url = getURL(title, author)
  let a = document.createElement("a")
  a.setAttribute("href", url)
  a.setAttribute("target", "_blank")
  a.style.setProperty("margin", ".25em")
  a.appendChild(img)

  return a
}

function refreshPendingChecks(func) {
  // clear out remaining ones:
  pendingChecks.forEach(clearTimeout)
  // set new ones
  pendingChecks[0] = setTimeout(func, 1000)
  pendingChecks[1] = setTimeout(func, 2000)
  pendingChecks[2] = setTimeout(func, 3000)
  pendingChecks[3] = setTimeout(func, 5000)
}

function injectLinks() {
  let elems = findBookElems()
  elems = elems.filter((elem) => !elem[2].innerHTML.includes(SEARCH_SITE))
  elems.forEach((elem) => {
    let a = createLink(elem[0], elem[1])
    elem[2].appendChild(a)
  })
  if (elems.length > 0) pendingChecks.forEach(clearTimeout)
}

async function main() {
  if (!SEARCH_SITE || !SEARCH_PARAM) {
    alert("The BookBuyer add-on can only work if the search site is configured!")
    if (isAddon())
      window.open(chrome.runtime.getURL("options.html"))
    // TODO: write text and link to correct site
    else
      window.open("https://github.com/JonDerThan/bookbuyer")
    return
  }

  SEARCH_HOSTNAME = (new URL(SEARCH_SITE)).hostname

  let lastScroll = 0
  addEventListener("scroll", (e) => {
    // checked less than .5s ago
    if (e.timeStamp - lastScroll < 500) return
    lastScroll = e.timeStamp
    refreshPendingChecks(injectLinks)
  })

  injectLinks()
}

