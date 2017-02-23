const bearerPrefix = 'Bearer '
export default { install : (onReady) => {
  global.DD.Events.onReady(() => {
    global.DD.Events.getCurrentUserAsync((userJSON) => {
      global.DD.Events.getCurrentEventAsync((eventJSON) => {
        onReady(
          {
            primaryColor : '#000',
            currentUser  : userJSON,
            currentEvent : eventJSON,
            configuration: eventJSON,
            apiRootURL   : 'https://',
            bundleURL    : null,
            setTitle: () => {
              console.warn('setTitle not implemented on web')
            },
            requestAccessToken: (callback) => {
              global.DD.Events.getSignedAPIAsync('', '', (url, auth) => {
                callback(null, auth.substring(bearerPrefix.length, auth.length))
              })
            },
            refreshAccessToken: (token, callback) => {
              global.DD.Events.getSignedAPIAsync('', '', (url, auth) => {
                callback(null, auth.substring(bearerPrefix.length, auth.length))
              })
            },
            canOpenURL: (url, callback) => {
              callback(null, true)
            },
            openURL: (url) => {
              document.location = url
            },
            showMenu: (url) => {
              return
            },
            setNavigationBarHidden: (hidden, callback) => {
              return
            }
          }
        )
      })
    })
  })
}}