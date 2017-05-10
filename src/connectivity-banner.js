import React, { Component } from 'react';
import { StyleSheet, Text, Animated } from 'react-native'
import Statuses from './statuses'

export default class extends Component {
  constructor(props) {
    super()

    this.state = { status: this.getStatusType('idle'), opacity: new Animated.Value(1) }
    this.setAPI(props.api)
  }

  componentWillReceiveProps(nextProps) {
    this.setAPI(nextProps.api)
  }

  getStatusType(status) {
    const statusMap = (this.props && this.props.statusMap) ? this.props.statusMap : {}
    if (statusMap[status]) {
      return statusMap[status]
    }

    switch (status) {
      case 'idle': return 'Idle'
      case Statuses.STATUS_AUTHENTICATING.type: return 'Authenticating'
      case Statuses.STATUS_CONNECTING.type: return 'Connecting'
      case Statuses.STATUS_DISCONNECTED.type: return 'Disconnected'
      case Statuses.STATUS_ERROR.type: return 'Error'
      case Statuses.STATUS_READY.type: return 'Connected'
      case Statuses.STATUS_UNCONNECTED.type: return 'Disconnected'
    }

    return status
  }

  setAPI(api) {
    if (this.api !== api) {
      this.api = api

      this.api.status.subscribe((status) => {
        const props = this.props || {}
        this.setState({ status: this.getStatusType(status.type) })
        if (status.type === 'ready') {
          Animated.timing(this.state.opacity, {
            toValue: 0,
            duration: props.fadeOutDuration || 500,
            delay: props.fadeOutDelay || 500,
            useNativeDriver: true
          }).start()
        } else {
          Animated.timing(this.state.opacity, {
            toValue: 1,
            duration: props.fadeInDuration || 500,
            delay: props.fadeInDelay || 500,
            useNativeDriver: true
          }).start()
        }
      })
    }
  }

  render() {
    return (
      <Animated.View style={[styles.container, { opacity: this.state.opacity }, this.props.style]}>
        <Text style={[styles.text, this.props.textStyle]}>{this.state.status}</Text>
      </Animated.View>
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