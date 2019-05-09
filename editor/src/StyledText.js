import React from 'react';
import { Text, StyleSheet } from 'react-native';

const StyledText = ({ text, textStyles = [], type = 'text' }) => {
  let inputStyles = [styles.default]
  textStyles.forEach(item => {
    const key = item.toLowerCase()
    if(styles[key]) {
      inputStyles.push(styles[key])
    }
  });

  if(styles[type]) {
    inputStyles.push(styles[type])
  }

  return (
    <Text
      selectable={false}
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
  strikethrough: {
    textDecorationLine: 'line-through',
    color: 'gray',
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