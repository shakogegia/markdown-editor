import React from 'react';
import { Text, TextInput, FlatList, Keyboard, StyleSheet } from 'react-native';

export default StyleSheet.create({
  flatList: {
    flex: 1,
    backgroundColor: 'white'
  },
  container: {
    flex: 1,
  },
  editor: {
    padding: 20,
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
    paddingTop: 0,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
    marginBottom: 2,
  },
  hr: {
    height: 1,
    flex: 1,
    backgroundColor: '#e3e3e3',
    marginVertical: 10,
  },
  imageRow: {
    flex: 1,
    marginVertical: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: '#e3e3e3',
    overflow: 'hidden',
    backgroundColor: 'white'
  },
  image: {
    width: '100%',
    height: 200,
  },
  bullet: {
    fontWeight: 'bold',
    marginRight: 5
  },
  numberOrder: {
    width: 20,
    marginRight: 2
  },
  checkbox: {
    paddingRight: 5,
  },
  sketchContainer: {
    flex: 1,
    padding: 20
  },
  sketch: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: '#e3e3e3',
    backgroundColor: '#ffffff'
  },
  colorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDotSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'black'
  },
  sketchFooter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
})
