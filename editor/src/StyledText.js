import React from 'react';
import { Text, StyleSheet } from 'react-native';

import { ROW_TYPES } from "./Constants";

const StyledText = ({ text, textStyles = [], type = ROW_TYPES.TEXT, isCompleted = false }) => {

  let inputStyles = [styles.default]

  // Block Styles
  textStyles.forEach(item => {
    const key = item.toLowerCase()
    if(styles[key]) {
      inputStyles.push(styles[key])
    }

    if(key.includes('fill')) {
      inputStyles.push({ backgroundColor: key.split('-')[1] })
    }

    if(key.includes('color')) {
      inputStyles.push({ color: key.split('-')[1] })
    }
  });

  // Row Styles
  if(styles[type]) {
    inputStyles.push(styles[type])
  }

  if(type === ROW_TYPES.TODOS && isCompleted === true) {
    inputStyles = [styles.default, styles.strikethrough]
  }

  return (
    <Text style={inputStyles}>{text}</Text>
  )
}

const styles = StyleSheet.create({
  default: {
    // backgroundColor: 'red',
  },
  bold: {
    fontWeight: 'bold'
  },
  italic: {
    fontStyle: 'italic'
  },
  underline: {
    textDecorationLine: 'underline'
  },
  link: {
    textDecorationLine: 'underline',
    color: '#2196f3',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  code: {
    backgroundColor: '#e3e3e3',
    color: 'red',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2
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
})

export default StyledText