import React, { Component } from 'react';
import ReactNative, { StyleSheet, View, Text, Image } from 'react-native';
import Update from 'react-addons-update'
const DD = ReactNative.NativeModules.DDBindings

var primaryColor = '#1279c6'

if (DD.primaryColor) {
  primaryColor = DD.primaryColor
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    alignItems: 'stretch',
    justifyContent: 'center',
    backgroundColor: 'white',
    flexDirection: 'column',
  },
  image: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200
  },
  text : {
    fontSize: 30,
    textAlign: 'center',
    color: '#333'
  },
  subtext : {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
    color: '#777'
  }
});


export default class EmptyCardView extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Image  style={styles.image} resizeMode="contain" source={{ uri: 'https://d30y9cdsu7xlg0.cloudfront.net/png/15602-200.png' }} />
        <Text style={styles.text}>You have no cards</Text>
        <Text style={styles.subtext}>Please explore the app and check back shortly for custom recommendations</Text>
      </View>
    )
  }
}