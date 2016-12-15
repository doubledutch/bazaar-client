import React, { Component } from 'react';
import ReactNative, { Alert, TouchableOpacity, Text } from 'react-native';
import Update from 'react-addons-update'
import SampleAPI from './sample.api'
import EmptyCardView from './sample.empty'

React.addons = { update: Update }

import Feed, { FeedCardWrapper, GET_CARD_WIDTH, CARD_MARGIN } from 'dd-feed'
import DDView from 'dd-ddview'

const featureName = 'feature_name'

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
    this.api = new SampleAPI(featureName, eventID)
    this.state = { sampleItems: [] }
  }

  componentDidMount() {
    var self = this

    this.api.connect().then((user) => {
      this.api.fetchUserDocumentsInCollection(collection = 'second_collection', query = null, watch = true).subscribe((results) => {
        this.setState({ sampleItems: results })
      })
    }).catch((err) => {
      Alert.alert('Error: ' + err)
    })

    // Log 
    DD.setTitle('Sample Feature')
  }

  insertSample() {
    const document = { user_id: this.api.getUserID(), name: new Date().getTime(), image_url: 'Something Else....' }
    this.api.insertIntoCollection('second_collection', document)
  }

  deleteSample() {
    if (this.state.sampleItems.length) {
      this.api.removeFromCollection('second_collection', { id: this.state.sampleItems[0].id })
    }
  }

  render() {
    var { height, width } = ReactNative.Dimensions.get('window')
    const ids = 'Sample Items: ' + (this.state.sampleItems || []).map((x) => x.name).join(', ')

    return (
      <View title="" style={{ flex: 1 }}>
        <Text>{ids}</Text>
        <TouchableOpacity onPress={this.insertSample.bind(this)} style={{ padding: 5, backgroundColor: 'blue', margin: 10 }}>
          <Text style={{ color: 'white' }}>Insert item into list</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.deleteSample.bind(this)} style={{ padding: 5, backgroundColor: 'red', margin: 10 }}>
          <Text style={{ color: 'white' }}>Delete item list</Text>
        </TouchableOpacity>
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
