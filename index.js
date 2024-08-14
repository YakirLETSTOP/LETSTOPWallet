/**
 * @format
 */
import './polyfills/polyfill.crypto'
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'text-encoding-polyfill'

AppRegistry.registerComponent(appName, () => App);