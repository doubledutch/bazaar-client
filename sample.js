import React, { Component } from 'react';
import ReactNative from 'react-native';
import Update from 'react-addons-update'
import SampleAPI from './sample.api'
import EmptyCardView from './sample.empty'

React.addons = { update: Update }

import Feed, { FeedCardWrapper, GET_CARD_WIDTH, CARD_MARGIN } from 'dd-feed'
import DDView from 'dd-ddview'

// const DD = ReactNative.Platform.select({
//   ios: () => ReactNative.NativeModules.DDBindings,
//   android: () => {
//     var bindings = ReactNative.NativeModules.DDBindings
//     var parsedBindings = {}
//     Object.keys(bindings).forEach((binding) => {
//       parsedBindings[binding] = bindings[binding]
//     })
//     ['currentEvent','currentUser','configuration'].forEach((key) => {
//       parsedBindings[key] = JSON.parse(parsedBindings[key])
//     })
//     return parsedBindings
//   },
// })();

const DD = ReactNative.NativeModules.DDBindings
const eventID = ReactNative.Platform.select({
  ios: () => DD.currentEvent.EventId,
  android: () => JSON.parse(DD.currentEvent).EventId
})();

const View = ReactNative.Platform.select({
  ios: () => DDView,
  android: () => ReactNative.View,
})();

class CardView extends Component {
  constructor() {
    super()
    this.api = new SampleAPI()
  }

  componentDidMount() {
    var self = this

    this.api.connect().then(() => {
      debugger
    }).catch((err) => {
      debugger
    })

    // Log 
    this.onLogMetric("base", "base", { action: 'loaded' })
    DD.setTitle('Now')
  }

  onLogMetric(templateID, id, data) {
    SampleAPI.logCardMetric(eventID, templateID, id, data).then((response) => {
    })
  }

  render() {
    var { height, width } = ReactNative.Dimensions.get('window')

    return (
      <View title="" style={{ flex: 1 }}>
      </View>
    )
  }
}

const pstyles = ReactNative.StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dedede',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

export default CardView
