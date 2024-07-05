const { withAndroidStyles } = require("expo/config-plugins")

function withAndroidAppThemeItems(config, appThemeItems) {
  return withAndroidStyles(config, (config) => {
    if (!appThemeItems || Object.keys(appThemeItems).length === 0) return config

    const styles = config.modResults
    if (!styles.resources.style) return config

    styles.resources.style.forEach((style) => {
      if (!styles.resources.style) return

      if (style.$.name === "AppTheme") {
        const customItems = Object.entries(appThemeItems).map(([key, value]) => ({
          $: { name: key },
          _: value,
        }))

        style.item = [...style.item, ...customItems]
      }
    })

    return config
  })
}

module.exports = withAndroidAppThemeItems
