import React from 'react';
import { Text, View, TouchableOpacity, ScrollView, StyleSheet, InteractionManager } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import getEmitter from "./EventEmitter";
import EVENTS from "./Events";
import { COLORS } from "./Constants";

const eventEmitter = getEmitter()

const HEIGHT = 38

const Divider = () => (
  <View style={styles.divider} />
)

const Button = ({ icon, name, isActive = false, isDisabled = false, arrow = false, onPress = () => {} }) => {
  const hasIcon = !!icon
  const hasName = !!name

  const activeButtonStyle = isActive ? styles.activeButton : {}
  const disabledButtonStyle = isDisabled ? styles.disabledButton : {}

  const textStyles = hasIcon && hasName ? styles.iconText : {}
  
  return (
  <TouchableOpacity style={[styles.button, activeButtonStyle, disabledButtonStyle]} disabled={isDisabled} onPress={onPress}>
    {hasIcon && <MaterialIcons name={icon} color="black" size={20} />}
    {hasName && <Text style={[ textStyles ]}>{name}</Text>}
    {arrow && <MaterialIcons name={"keyboard-arrow-down"} color="#e3e3e3" size={16} />}
  </TouchableOpacity>
)}

const listeners = {}

const VIEWS = {
  DEFAULT: 'default',
  ALIGN: 'align',
  FILL: 'fill',
  COLOR: 'color',
}

class Toolbar extends React.Component {

  state = {
    activeStyles: [],
    activeRowType: '',
    activeView: VIEWS.DEFAULT
  }

  componentDidMount() {
    listeners.activeStylesChanged = getEmitter().addListener(EVENTS.ACTIVE_STYLE_CHANGED, this.activeStylesChanged)
    listeners.rowTypeChanged = getEmitter().addListener(EVENTS.ROW_TYPE_CHANGED, this.rowTypeChanged)
  }

  componentWillUnmount() {
    if(listeners) {
      for (const key in listeners) {
        if (listeners.hasOwnProperty(key)) {
          const listener = listeners[key];
          listener.remove()
        }
      }
    }
  }

  activeStylesChanged = ({ activeStyles }) => {
    this.setState({ activeStyles })
  }
  
  rowTypeChanged = ({ type }) => {
    this.setState({ activeRowType: type })
  }

  emit = (event, params = {}) => () => {
    eventEmitter.emit(event, params)
  }

  toggleFormatAlign = () => {
    this.setState({ activeView: VIEWS.ALIGN })
  }

  toggleFormatFill = () => {
    this.setState({ activeView: VIEWS.FILL })
  }
  
  toggleFormatColor = () => {
    this.setState({ activeView: VIEWS.COLOR })
  }
  
  setDefaultView = () => {
    this.setState({ activeView: VIEWS.DEFAULT })
  }
  
  selectColor = ({ color = 'default' }) => () => {
    const { activeView } = this.state
    let newColor = color

    if(activeView === VIEWS.COLOR && color === 'default') {
      newColor = 'black'
    }

    if(activeView === VIEWS.FILL && color === 'default') {
      newColor = 'transparent'
    }

    InteractionManager.runAfterInteractions(() => {
      this.emit(EVENTS.CHANGE_COLOR_STYLE,  { color: newColor, type: activeView })()
    })
    // this.setDefaultView()
  }

  renderColorPicker = () => {
    const { activeStyles = [] } = this.state
    return (
      <React.Fragment>
        <Divider />
        <Button icon="format-color-reset" onPress={this.selectColor({ color: 'default' })} />
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps={"always"}
          automaticallyAdjustContentInsets={false}
          keyboardDismissMode="none"
        >
        
        {COLORS.map(item => {
          const type = VIEWS.COLOR ? 'color' : 'fill'
          const isActive = activeStyles.includes(`${type}-${item}`)
          return (
          <React.Fragment key={`color-${item}`}>
            <TouchableOpacity onPress={this.selectColor({ color: item })} style={[styles.colorDot, { backgroundColor: item }]}>
              {isActive && (
                <View style={styles.checkboxContainer}>
                  <MaterialIcons name="check" size={24} color="white" />
                </View>
              )}
            </TouchableOpacity>
            <Divider />
          </React.Fragment>
        )})}

        </ScrollView>
        <Divider />
        <Button icon="close" onPress={this.setDefaultView} />
        <Divider />
        <Button icon="keyboard-hide" onPress={this.emit(EVENTS.HIDE_KEYBOARD)} />
      </React.Fragment>
    )
  }

  renderAlign = () => {
    return (
      <React.Fragment>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps={"always"}
          automaticallyAdjustContentInsets={false}
          keyboardDismissMode="none"
        >
        
        <Divider />
        <Button icon="format-align-center" onPress={this.emit(EVENTS.ALIGN_ROW, { type: 'center' })} />
        <Divider />
        <Button icon="format-align-justify" onPress={this.emit(EVENTS.ALIGN_ROW, { type: 'justify' })} />
        <Divider />
        <Button icon="format-align-left" onPress={this.emit(EVENTS.ALIGN_ROW, { type: 'left' })} />
        <Divider />
        <Button icon="format-align-right" onPress={this.emit(EVENTS.ALIGN_ROW, { type: 'right' })} />
        <Divider />

        </ScrollView>
        <Divider />
        <Button icon="close" onPress={this.setDefaultView} />
        <Divider />
        <Button icon="keyboard-hide" onPress={this.emit(EVENTS.HIDE_KEYBOARD)} />
      </React.Fragment>
    )
  }

  renderDefault = () => {
    const { activeStyles, activeRowType, activeView } = this.state

    const isActiveBold = activeStyles.includes('bold')
    const isActiveItalic = activeStyles.includes('italic')
    const isActiveUnderline = activeStyles.includes('underline')
    const isActiveStrikeThrough = activeStyles.includes('strikethrough')
    const isActiveCode = activeStyles.includes('code')
    const isActiveLink = activeStyles.includes('link')

    const isDisabledBold = activeRowType.includes('heading')
    const isDisabledItalic = activeRowType.includes('heading')
    const isDisabledUnderline = activeRowType.includes('heading')
    const isDisabledStrikeThrough = activeRowType.includes('heading')
    const isDisabledCode = activeRowType.includes('code')
    const isDisabledLink = activeRowType.includes('link')

    return (
      <React.Fragment>
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
          
          <Button icon="insert-photo" onPress={this.emit(EVENTS.SHOW_UPLOAD_FILE)} />
          <Divider />

          <Button icon="format-bold" isActive={isActiveBold} isDisabled={isDisabledBold} onPress={this.emit(EVENTS.TOGGLE_STYLE, { style: 'bold'})} />
          <Button icon="format-italic" isActive={isActiveItalic} isDisabled={isDisabledItalic} onPress={this.emit(EVENTS.TOGGLE_STYLE, { style: 'italic'})} />
          <Button icon="format-underlined" isActive={isActiveUnderline} isDisabled={isDisabledUnderline} onPress={this.emit(EVENTS.TOGGLE_STYLE, { style: 'underline'})} />
          <Button icon="strikethrough-s" isActive={isActiveStrikeThrough} isDisabled={isDisabledStrikeThrough} onPress={this.emit(EVENTS.TOGGLE_STYLE, { style: 'strikethrough'})} />
          <Divider />
          
          <Button icon="format-align-center" onPress={this.toggleFormatAlign} />
          <Divider />

          <Button icon="format-color-fill" onPress={this.toggleFormatFill} />
          <Button icon="format-color-text" onPress={this.toggleFormatColor} />
          <Divider />

          <Button icon="format-clear" onPress={this.emit(EVENTS.CLEAR_STYLES)} />
          <Divider />

          <Button icon="code" name="Code" isActive={isActiveCode} isDisabled={isDisabledCode} onPress={this.emit(EVENTS.TOGGLE_STYLE, { style: 'code'})} />
          {/*
            <Button icon="link" name="Link" isActive={isActiveLink} isDisabled={isDisabledLink} onPress={this.emit(EVENTS.TOGGLE_STYLE, { style: 'link'})} />
          */}
          <Divider />
          
          <Button name="Duplicate" onPress={this.emit(EVENTS.DUPLICATE_ROW)} />
          <Divider />

          {/*
          */}
          <Button icon="format-indent-increase" onPress={this.emit(EVENTS.CHANGE_BLOCK_INDENT, { direction: 'increase' })} />
          <Button icon="format-indent-decrease" onPress={this.emit(EVENTS.CHANGE_BLOCK_INDENT, { direction: 'decrease' })} />
          <Divider />

          <Button icon="vertical-align-top" onPress={this.emit(EVENTS.CHANGE_BLOCK_INDEX, { direction: 'up' })} />
          <Button icon="vertical-align-bottom" onPress={this.emit(EVENTS.CHANGE_BLOCK_INDEX, { direction: 'down' })} />
          <Divider />

          <Button icon="undo" onPress={this.emit(EVENTS.BROWSE_HISTORY, { undo: true })} />
          <Button icon="redo" onPress={this.emit(EVENTS.BROWSE_HISTORY, { redo: true })} />
          <Divider />


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
        <Button icon="fullscreen" onPress={this.emit(EVENTS.TOGGLE_FULL_SCREEN)} />
        <Divider />
        <Button icon="keyboard-hide" onPress={this.emit(EVENTS.HIDE_KEYBOARD)} />
      </React.Fragment>
    )
  }

  render() {
    const { activeStyles, activeRowType, activeView } = this.state

    return (
      <View style={styles.toolbar}>
        { activeView === VIEWS.ALIGN && this.renderAlign() }
        { activeView === VIEWS.COLOR && this.renderColorPicker() }
        { activeView === VIEWS.FILL && this.renderColorPicker() }
        { activeView === VIEWS.DEFAULT && this.renderDefault() }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  toolbar: {
    // flex: 1,
    flexDirection: 'row',
    height: HEIGHT,
    borderTopWidth: 1/2,
    borderColor: '#e3e3e3',
  },
  contentContainerStyle: {
    paddingRight: 120
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
  },
  disabledButton: {
    opacity: 0.5
  },
  iconText: {
    marginLeft: 5
  },
  colorDot: {
    minWidth: 40,
  },
  checkboxContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(55, 71, 79, 0.1)'
  }
})

export default Toolbar