The extension is supplied both as an add-on and as a userscript. The userscript
is just a copy of the add-on and should not be edited directly. The `build.mjs`
file which can be run with `npm run build` takes care of the copying.
Additionally the `build` command takes care of setting the correct version
number in the manifest and userscript header. The version number itself should
only be edited in `package.json`.

Use `npm run interactive-test` to generate the extension and to test it.


### Android test

To test the extension on Android, install *Firefox Nightly* and enable USB
debugging in both the Firefox and the Android device settings. Then install the
[Android Platform Tools](https://developer.android.com/tools/releases/platform-tools)
(namely `adb`). Connect the Android device and run `adb devices` to get the ID
of your device. Then create a file `web-ext-config.js` with the following
contents:

```javascript
module.exports = {
  run: {
    adbDevice: "YOUR_DEVICE_ID"
  }
}
```

