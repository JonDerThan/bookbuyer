# BookBuyer

Add-on that displays links on goodread pages, which link to searches on an
arbitrary, configurable website.

This can either be installed as an add-on on [Firefox](https://addons.mozilla.org/en-US/firefox/addon/bookbuyer/)
and [Chrome](https://chromewebstore.google.com/detail/bookbuyer/ecgniefnmkclifnmohjhkbkkblgpinan)
or as a [userscript](https://raw.githubusercontent.com/JonDerThan/bookbuyer/main/bookbuyer.user.js).

## Settings

You can configure the search settings for the injected links!

**Firefox:** Click the add-on icon in the top right corner and click
`Manage Extension` on the add-on. Then click `Preferences`.

**Chrome:** Click the add-on icon in the top right corner and click on the
three dots beside this add-on. Then click `Options`.


## Userscript users

To configure the search site and the search settings you have to modify the
script a little bit. Head to your userscript manager's dashboard, edit this
script, and modify the variables `SEARCH_SITE`, `SEARCH_PARAM`, `inclAuthor`,
and `searchParams `. See the comments for more infos.

