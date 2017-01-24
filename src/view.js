import ReactNative, { StyleSheet, Navigator, Platform, View, Text, TouchableOpacity, Image } from 'react-native';
import React from 'react'

const backAndroid = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAAG1BMVEUAAAD////////////////////////////////rTT7CAAAACHRSTlMADA1hYn+Aw5/nblIAAAB6SURBVHja7dW7DYBADARR87Fx/xUjEVx8HJoEzRSwL9wwMzNbKBPe7054HxWynxLcR4Xs0QHvX5v77rvv/k/3d/fddx/YX4zeb3q/J/ZhoL4CtBC0ELQQU8KXI1NQUFBQUFBQmBfOYIUKqBr7qFABVs8+KlSYmZm97wbp0CIIUTEq4AAAAABJRU5ErkJggg=='
var NavigationBarRouteMapper = {

  LeftButton: function (route, navigator, index, navState) {

    var previousRoute = index === 0 ? { title: '' } : navState.routeStack[index - 1];
    var leftIcon = backAndroid;

    return (
      <TouchableOpacity
        onPress={() => { this.props.showMenu() } }
        style={styles.navBarLeftButton}>
        <View>
          <Image source={{ uri: leftIcon }} resizeMode='contain' style={[styles.hamburger]} />
        </View>
      </TouchableOpacity>
    );
  },

  RightButton: function (route, navigator, index, navState) {
    return null
  },

  Title: function (route, navigator, index, navState) {
    return (
      <Text style={[styles.navBarText, styles.navBarTitleText]}>
        {route.title}
      </Text>
    );
  },

};

class DDView extends React.Component {
  render() {
    var data = []
    var child = this.props.children
    return (
      <Navigator
        initialRoute={{ name: '', index: 1, title: this.props.title }}
        renderScene={(route, navigator) => (
          <View style={styles.scene}>{child}</View>
        )}
        navigationBar={
          <Navigator.NavigationBar
            routeMapper={NavigationBarRouteMapper}
            style={[styles.navBar, { backgroundColor: this.props.primaryColor }]}
            />
        }
        />
    );
  }
};

var styles = StyleSheet.create({
  hamburger: {
    marginVertical: 12,
    height: 17,
    width: 23,
    marginLeft: 7
  },
  navBar: {
    backgroundColor: '#fff',
  },
  navBarText: {
    fontSize: 16,
    marginVertical: 10,
    color: '#fff'
  },
  navBarTitleText: {
    color: '#fff',
    fontWeight: '600',
    marginVertical: 9,
  },
  navBarLeftButton: {
    paddingLeft: 10,
  },
  navBarRightButton: {
    paddingRight: 10,
  },
  navBarButtonText: {
    color: '#fff'
  },
  scene: {
    flex: 1,
    paddingTop: 64,
    flexDirection: 'column',
  },
});

module.exports = DDView;