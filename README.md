# Gymrapp -- The app for gym rats

## Development Notes

Refer to this [Expo documentation](https://docs.expo.dev/workflow/customizing/) for how to run the app during development.

Refer to this [Expo documentation](https://docs.expo.dev/develop/development-builds/introduction/) for more information on what a "development build" is.

### Adding custom native code to development builds

1. Run `npx expo run:android` to build and run locally
   1. If unsuccessful, run `npx expo prebuild --clean` to delete and regenerate native project files
   2. If still unsuccessful, try deleting directory `node_modules`, run `npm install`
2. The `postinstall` npm script created issues with `npx expo prebuild --clean` where some packages relied on plugins in `app.json` to correctly apply native installation steps

### Build failures

Build failures are more likely than not dependency issues, follow instructions here: https://docs.expo.dev/build-reference/troubleshooting/#verify-that-your-javascript-bundles-locally to build locally in release mode to make sure there are no issues before submitted to EAS.

To debug error messages, it can be helpful to find which module is throwing it with

`find node_modules/ -type f -exec grep -H '<error message keyword>' {} \;`

https://docs.expo.dev/debugging/runtime-issues/#native-debugging

### Other notes

- For some reason, I was unable to open JS debugger with the `metro-config` package in `package.json` where it was unable to GET the JSON list from `http://192.168.1.105:8081/json/list`. Once removed, JS debugger worked again. We don't need to install `metro-config` because it comes with Expo.
