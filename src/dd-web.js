const bearerPrefix = 'Bearer '
export default { install : (onReady) => {
  window.DD.Events.onReady(() => {
    window.DD.Events.getCurrentUserAsync((userJSON) => {
      window.DD.Events.getCurrentEventAsync((eventJSON) => {
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
              window.DD.Events.getSignedAPIAsync('', '', (url, auth) => {
                callback(null, auth.substring(bearerPrefix.length, auth.length))
              })
            },
            refreshAccessToken: (token, callback) => {
              window.DD.Events.getSignedAPIAsync('', '', (url, auth) => {
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