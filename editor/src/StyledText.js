import React from 'react';
import { Text, StyleSheet } from 'react-native';

const StyledText = ({ text, textStyles = [], type = 'text' }) => {
  let inputStyles = [styles.default]

  // Block Styles
  textStyles.forEach(item => {
    const key = item.toLowerCase()
    if(styles[key]) {
      inputStyles.push(styles[key])
    }
  });

  // Row Styles
  if(styles[type]) {
    inputStyles.push(styles[type])
  }

  if(text === 'ze') {
    console.log(text, inputStyles)
  }

  return (
    <Text
      selectionColor={"red"}
      style={inputStyles}
      onPress={() => console.log("tetx") }
    >{text}</Text>
  )
}

const styles = StyleSheet.create({
  default: {
    // backgroundColor: 'red'
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
    fontWeight: 'bold',
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