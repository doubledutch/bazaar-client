'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactNative = require('react-native');

var _statuses = require('./statuses');

var _statuses2 = _interopRequireDefault(_statuses);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _class = function (_Component) {
  _inherits(_class, _Component);

  function _class(props) {
    _classCallCheck(this, _class);

    var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

    _this.state = { status: _this.getStatusType('idle'), opacity: new _reactNative.Animated.Value(1) };
    _this.setAPI(props.api);
    return _this;
  }

  _createClass(_class, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      this.setAPI(nextProps.api);
    }
  }, {
    key: 'getStatusType',
    value: function getStatusType(status) {
      var statusMap = this.props && this.props.statusMap ? this.props.statusMap : {};
      if (statusMap[status]) {
        return statusMap[status];
      }

      switch (status) {
        case 'idle':
          return 'Idle';
        case _statuses2.default.STATUS_AUTHENTICATING.type:
          return 'Authenticating';
        case _statuses2.default.STATUS_CONNECTING.type:
          return 'Connecting';
        case _statuses2.default.STATUS_DISCONNECTED.type:
          return 'Disconnected';
        case _statuses2.default.STATUS_ERROR.type:
          return 'Error';
        case _statuses2.default.STATUS_READY.type:
          return 'Connected';
        case _statuses2.default.STATUS_UNCONNECTED.type:
          return 'Disconnected';
      }

      return status;
    }
  }, {
    key: 'setAPI',
    value: function setAPI(api) {
      var _this2 = this;

      if (this.api !== api) {
        this.api = api;

        this.api.status.subscribe(function (status) {
          var props = _this2.props || {};
          _this2.setState({ status: _this2.getStatusType(status.type) });
          if (status.type === 'ready') {
            _reactNative.Animated.timing(_this2.state.opacity, {
              toValue: 0,
              duration: props.fadeOutDuration || 500,
              delay: props.fadeOutDelay || 500
            }).start();
          } else {
            _reactNative.Animated.timing(_this2.state.opacity, {
              toValue: 1,
              duration: props.fadeInDuration || 500,
              delay: props.fadeInDelay || 500
            }).start();
          }
        });
      }
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        _reactNative.Animated.View,
        { style: [styles.container, { opacity: this.state.opacity }, this.props.style] },
        _react2.default.createElement(
          _reactNative.Text,
          { style: [styles.text, this.props.textStyle] },
          this.state.status
        )
      );
    }
  }]);

  return _class;
}(_react.Component);

exports.default = _class;


var styles = _reactNative.StyleSheet.create({
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
});