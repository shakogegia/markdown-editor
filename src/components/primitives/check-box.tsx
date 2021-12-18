import React from 'react'
import { Text as RNText, TextProps } from 'react-native'

export function CheckBox({ children, style }: TextProps) {
  return <RNText style={style}>{children}</RNText>
}
