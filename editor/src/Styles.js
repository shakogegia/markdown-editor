import React from 'react';
import { Text, TextInput, FlatList, Keyboard, StyleSheet } from 'react-native';

export default StyleSheet.create({
  flatList: {
    flex: 1,
  },
  contentContainerStyle: {
    // flex: 1
  },
  text: {
    fontSize: 16,
  },
  heading1: {
    fontSize: 25,
  },
  heading2: {
    fontSize: 21,
  },
  heading3: {
    fontSize: 18,
  },
  blockquote: {
    fontStyle: 'italic',
    borderLeftWidth: 2,
    paddingLeft: 10,
    paddingVertical: 2,
    marginVertical: 3,
  },
  textInput: {
    flex: 1,
    // backgroundColor: 'red'
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  bullet: {
    fontWeight: 'bold',
    marginRight: 5
  },
  numberOrder: {
    width: 20,
    marginRight: 2
  }
})
