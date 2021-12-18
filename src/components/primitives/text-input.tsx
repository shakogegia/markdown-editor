import React from 'react'
import { TextInput as RNTextInput, TextInputProps } from 'react-native'

export function TextInput({ children, style }: TextInputProps) {
  return <RNTextInput style={style}>{children}</RNTextInput>
}
