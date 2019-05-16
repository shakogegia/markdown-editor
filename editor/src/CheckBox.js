import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const CheckBox = ({ style = {}, isChecked = false, toggle = () => {} }) => {
  const icon = isChecked ? 'check-box' : 'check-box-outline-blank'
  return (
    <TouchableOpacity style={[style]} onPress={toggle}>
      <MaterialIcons name={icon} size={20} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  default: {
    // backgroundColor: 'red',
  },
})

export default CheckBox