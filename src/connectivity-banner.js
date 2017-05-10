import React, { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native'

export default class extends Component {
  constructor(props) {
    super()

    this.state = { status: 'Idle' }
    this.setAPI(props.api)
  }

  componentWillReceiveProps(nextProps) {
    this.setAPI(nextProps.api)
  }

  setAPI(api) {
    if (this.api !== api) {
      this.api = api

      // TODO, hook the event here
      this.api.status.subscribe((status) => {
        this.setState({ status: status.type })
      })
    }
  }

  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        <Text style={[styles.text, this.props.textStyle]}>{this.state.status}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: 30,
    backgroundColor: '#000',
    flexDirection: 'column',
    justifyContent: 'center',
    left: 0,
    right: 0
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600'
  }
})