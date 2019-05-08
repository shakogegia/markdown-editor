import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import { Container, Header, Body, Title } from "native-base";

import {
  Editor,
  Toolbar,
  Context
} from "./editor";

const test = () => {
  alert()
}

export default class App extends React.Component {



  render() {
    return (
      <Container>
        <Header>
          <Body>
            <Title>Text Editor</Title>
          </Body>
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
