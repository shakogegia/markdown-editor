import React from 'react';
import { Text, StyleSheet } from 'react-native';

const StyledText = ({ text, textStyles = [] }) => {
  let inputStyles = [styles.default]
  textStyles.forEach(item => {
    const key = item.toLowerCase()
    if(styles[key]) {
      inputStyles.push(styles[key])
    }
  });

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
})

export default StyledText