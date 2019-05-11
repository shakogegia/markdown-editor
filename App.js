import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Root } from "native-base";

import Reactotron from 'reactotron-react-native'

import MainScreen from "./MainScreen";
// import CNScreen from "./CNScreen";

Reactotron
  .configure() // controls connection & communication settings
  .useReactNative() // add all built-in react native plugins
  .connect() // let's connect!

console.tron = Reactotron

export default class App extends React.Component {
  render() {
    return (
      <Root style={{ flex: 1 }}>
        <View style={styles.container}>
        
          <MainScreen />
          
          
        </View>
      </Root>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'red',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
});
