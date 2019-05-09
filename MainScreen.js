import React from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import { Container, Header, Body, Title, Right, Left, Button, Text } from "native-base";


import getEmitter from "./editor/src/EventEmitter";
import EVENTS from "./editor/src/Events";

import {
  Editor,
  Toolbar,
  Context
} from "./editor";


const eventEmitter = getEmitter()

export default class App extends React.Component {


  logState () {
    eventEmitter.emit(EVENTS.LOG_STATE)
  }

  render() {
    return (
      <Container>
        <Header>
          <Left>
            <Text></Text>
          </Left>
          <Body>
            <Title>Text Editor</Title>
          </Body>
          <Right>
            <TouchableOpacity onPress={this.logState}>
              <Text>Log State</Text>
            </TouchableOpacity>
          </Right>
        </Header>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.container}>
            
            <KeyboardAwareView keyboardShouldPersistTaps animated>
              <View style={styles.editor}>
                <Editor />
              </View>
              
              <Toolbar />
            </KeyboardAwareView>

          </View>
        </SafeAreaView>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'red',
    // alignItems: 'stretch',
    // justifyContent: 'center',
    // flexDirection: 'column',
  },
  editor: {
    // minHeight: 100,
    // width: 300,
    padding: 20,
    flex: 1,
    // backgroundColor: 'red'
  }
});
