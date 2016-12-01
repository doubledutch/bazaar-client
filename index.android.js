var React = require('react-native');
var { AppRegistry } = React;
var CardView = require('./cardview.js')

console.disableYellowBox = true;
AppRegistry.registerComponent('CardView', () => CardView.default);
