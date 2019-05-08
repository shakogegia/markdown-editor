import React from 'react';
import { Text, View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import getEmitter from "./EventEmitter";
import EVENTS from "./Events";

const eventEmitter = getEmitter()

const HEIGHT = 38

const Divider = () => (
  <View style={styles.divider} />
)

const Button = ({ icon, name, isActive = false, arrow = false, onPress = () => {} }) => {
  const hasIcon = !!icon
  const hasName = !!name

  const activeButtonStyle = isActive ? styles.activeButton : {}
  
  return (
  <TouchableOpacity style={[styles.button, activeButtonStyle]} onPress={() => onPress()}>
    {hasIcon && <MaterialIcons name={icon} color="black" size={20} />}
    {hasName && <Text>{name}</Text>}
    {arrow && <MaterialIcons name={"keyboard-arrow-down"} color="#e3e3e3" size={16} />}
  </TouchableOpacity>
)}

const listeners = {}

class Toolbar extends React.Component {

  state = {
    activeStyles: []
  }

  componentDidMount() {
    listeners.activeStylesChanged = getEmitter().addListener(EVENTS.ACTIVE_STYLE_CHANGED, this.activeStylesChanged)
  }

  componentWillUnmount() {
    listeners.forEach(listener => {
      listener.remove()
    })
  }

  activeStylesChanged = ({ activeStyles }) => {
    this.setState({ activeStyles })
  }

  emit = (event, params = {}) => () => {
    eventEmitter.emit(event, params)
  }

  render() {
    const { activeStyles } = this.state


    const isActiveBold = activeStyles.includes('bold')
    const isActiveItalic = activeStyles.includes('italic')
    const isActiveUnderline = activeStyles.includes('underline')

    return (
      <View style={styles.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps={"always"}
          automaticallyAdjustContentInsets={false}
          keyboardDismissMode="none"
          contentContainerStyle={styles.contentContainerStyle}
        >
          <Button icon="add-circle-outline" onPress={this.emit(EVENTS.SHOW_INSERT_BLOCK)} />
          <Divider />

          <Button name="Turn Into" arrow onPress={this.emit(EVENTS.CHANGE_BLOCK_TYPE)} />
          <Divider />

          <Button icon="format-bold" isActive={isActiveBold} onPress={this.emit(EVENTS.TOGGLE_STYLE, { style: 'bold'})} />
          <Button icon="format-italic" isActive={isActiveItalic} o onPress={this.emit(EVENTS.TOGGLE_STYLE, { style: 'italic'})} />
          <Button icon="format-underlined" isActive={isActiveUnderline} o onPress={this.emit(EVENTS.TOGGLE_STYLE, { style: 'underline'})} />
          {/*
            <Button icon="strikethrough-s" />
          */}
          <Divider />


          <Button name="Code" />
          <Button name="Link" />
          <Button name="Duplicate" onPress={this.emit(EVENTS.DUPLICATE_ROW)} />
          <Divider />

          <Button icon="vertical-align-top" onPress={this.emit(EVENTS.CHANGE_BLOCK_INDEX, { direction: 'up' })} />
          <Button icon="vertical-align-bottom" onPress={this.emit(EVENTS.CHANGE_BLOCK_INDEX, { direction: 'down' })} />
          <Divider />

          {/*
            <Button icon="format-indent-increase" onPress={this.emit(EVENTS.CHANGE_BLOCK_INDENT, { direction: 'increase' })} />
            <Button icon="format-indent-decrease" onPress={this.emit(EVENTS.CHANGE_BLOCK_INDENT, { direction: 'decrease' })} />
            <Divider />
          */}

          <Button icon="delete" onPress={this.emit(EVENTS.DELETE_BLOCK)} />
          <Divider />

          {/*
            <Button name="H1" />
            <Divider />

            <Button name="H2" />
            <Divider />

            <Button name="H3" />
            <Divider />

            <Button name="Body" />
            <Divider />

            <Button icon="format-list-bulleted" />
            <Divider />
            
            <Button icon="format-list-numbered" />
            <Divider />
          */}
          
        </ScrollView>
        <Divider />
        <Button icon="keyboard-hide" onPress={this.emit(EVENTS.HIDE_KEYBOARD)} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  toolbar: {
    // flex: 1,
    flexDirection: 'row',
    height: HEIGHT,
    borderWidth: 1/2,
    borderColor: '#e3e3e3',
  },
  contentContainerStyle: {
    paddingRight: 90
  },
  divider: {
    height: HEIGHT,
    width: 1/2,
    backgroundColor: '#e3e3e3'
  },
  button: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    flexDirection: 'row'
  },
  activeButton: {
    backgroundColor: '#e7e7e7'
  }
})

export default Toolbar