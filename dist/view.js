'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _reactNative = require('react-native');

var _reactNative2 = _interopRequireDefault(_reactNative);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var backAndroid = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAAG1BMVEUAAAD////////////////////////////////rTT7CAAAACHRSTlMADA1hYn+Aw5/nblIAAAB6SURBVHja7dW7DYBADARR87Fx/xUjEVx8HJoEzRSwL9wwMzNbKBPe7054HxWynxLcR4Xs0QHvX5v77rvv/k/3d/fddx/YX4zeb3q/J/ZhoL4CtBC0ELQQU8KXI1NQUFBQUFBQmBfOYIUKqBr7qFABVs8+KlSYmZm97wbp0CIIUTEq4AAAAABJRU5ErkJggg==';
var NavigationBarRouteMapper = {

  LeftButton: function LeftButton(route, navigator, index, navState) {
    var _this = this;

    var previousRoute = index === 0 ? { title: '' } : navState.routeStack[index - 1];
    var leftIcon = backAndroid;

    return _react2.default.createElement(
      _reactNative.TouchableOpacity,
      {
        onPress: function onPress() {
          _this.props.showMenu();
        },
        style: styles.navBarLeftButton },
      _react2.default.createElement(
        _reactNative.View,
        null,
        _react2.default.createElement(_reactNative.Image, { source: { uri: leftIcon }, resizeMode: 'contain', style: [styles.hamburger] })
      )
    );
  },

  RightButton: function RightButton(route, navigator, index, navState) {
    return null;
  },

  Title: function Title(route, navigator, index, navState) {
    return _react2.default.createElement(
      _reactNative.Text,
      { style: [styles.navBarText, styles.navBarTitleText] },
      route.title
    );
  }

};

var DDView = function (_React$Component) {
  _inherits(DDView, _React$Component);

  function DDView() {
    _classCallCheck(this, DDView);

    return _possibleConstructorReturn(this, (DDView.__proto__ || Object.getPrototypeOf(DDView)).apply(this, arguments));
  }

  _createClass(DDView, [{
    key: 'render',
    value: function render() {
      var data = [];
      var child = this.props.children;
      return _react2.default.createElement(_reactNative.Navigator, {
        initialRoute: { name: '', index: 1, title: this.props.title },
        renderScene: function renderScene(route, navigator) {
          return _react2.default.createElement(
            _reactNative.View,
            { style: styles.scene },
            child
          );
        },
        navigationBar: _react2.default.createElement(_reactNative.Navigator.NavigationBar, {
          routeMapper: NavigationBarRouteMapper,
          style: [styles.navBar, { backgroundColor: this.props.primaryColor }]
        })
      });
    }
  }]);

  return DDView;
}(_react2.default.Component);

;

var styles = _reactNative.StyleSheet.create({
  hamburger: {
    marginVertical: 12,
    height: 17,
    width: 23,
    marginLeft: 7
  },
  navBar: {
    backgroundColor: '#fff'
  },
  navBarText: {
    fontSize: 16,
    marginVertical: 10,
    color: '#fff'
  },
  navBarTitleText: {
    color: '#fff',
    fontWeight: '600',
    marginVertical: 9
  },
  navBarLeftButton: {
    paddingLeft: 10
  },
  navBarRightButton: {
    paddingRight: 10
  },
  navBarButtonText: {
    color: '#fff'
  },
  scene: {
    flex: 1,
    paddingTop: 64,
    flexDirection: 'column'
  }
});

module.exports = DDView;