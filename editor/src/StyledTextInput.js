import React from 'react';
import { TextInput, View } from 'react-native';

import StyledText from "./StyledText";

class StyledInput extends React.Component {

  state = {
    now: null,
    hide: false,
    value: ''
  }

  input = null

  componentDidMound() {
    const { value = '' } = this.props
    this.setState({ value })
  }

  componentDidUpdate(prevProps) {
    // console.log(prevProps.row)
    if(prevProps.row.text !== this.props.row.text) {
      console.log(prevProps.row.text, this.props.row.text)
      this.forceUpdate()
    }
  }

  handleKeyPress = (e) => {
    const { row, index } = this.props
    this.props.handleKeyPress({ row, index })(e)
  }

  onChangeText = (nv = '') => {
    const { row, index, onChangeText } = this.props
    const newValue = nv.replace(/\n/, '')
    this.setState({ value: newValue })
    onChangeText({ row, index })(nv)
  }

  getValue = () => {
    return this.state.value
  }

  focus = () => {
    if(this.input) {
      this.input.focus()
    }
  }

  setSelection = ({ start, end }) => {
    const { row, index, onSelectionChange } = this.props

    this.input.setNativeProps({ selection: { start, end } })
    setTimeout(() => {
      this.input.setNativeProps({ selection: { start, end } })
      console.log({ start, end })
      // setTimeout(() => {
        // onSelectionChange({ row, index })({ nativeEvent: { selection: { start, end } } })
        // setTimeout(() => {
        //   onSelectionChange({ row, index })({ nativeEvent: { selection: { start, end } } })
        // });
      // });
    })
  }

  refresh = ({ focus = false } = {}, callback = () => {}) => {
    this.setState({ hide: true }, () => {
      setTimeout(() => {
        this.setState({ hide: false }, () => {
          if(focus) {
            this.input.focus()
          }
          callback()
        })
      }, 0);
    })
  }
  
  onEndEditing = () => {
    this.refresh()
  }
  
  stylesChanged = ({ pointerAt, row, keyValue }) => {
    const { row: { value = '' }, index } = this.props
    this.refresh({ focus: true }, () => {
      if (value.length > pointerAt) {
        this.setSelection({ start: pointerAt + 1, end: pointerAt + 1 })
      } else {
        // const newValue = row.blocks.map(i => i.text).join('')
        // this.props.onSelectionChange({ row: this.props.row, index, value: newValue })({ nativeEvent: { selection: { start: pointerAt + 1, end: pointerAt + 1 } } })
      }
    })
  }

  render () {

    const {
      row,
      index,
      placeholder,
    
      onSubmitEditing,
      onFocus,
      onChangeText,
      handleKeyPress,
      onSelectionChange,
    
      textInput,
      inputStyles,
      alignStyles,
    } = this.props
    
    const { blocks = [] } = row
  
    if(this.state.hide) {
      return (
        <View style={[{ flexDirection: 'row', minHeight: 17, }, alignStyles]}>
          {blocks.map((block, i) => (
            <StyledText
              key={`${row.id}-${i}`}
              textStyles={block.styles}
              text={block.text}
              type={row.type}
              isCompleted={row.isCompleted}
            />
          ))}
        </View>
      )
    }

    return (
      <TextInput
        ref={(c) => { this.input = c; }}
        underlineColorAndroid="transparent"
        placeholder={placeholder}
        onSubmitEditing={onSubmitEditing({ row, index })}
        onFocus={onFocus({ row, index })}
        onChangeText={this.onChangeText}
        onKeyPress={this.handleKeyPress}
        onSelectionChange={onSelectionChange({ row, index })}
        onEndEditing={this.onEndEditing}
        style={[textInput, inputStyles, alignStyles]}
        clearButtonMode="never"
        blurOnSubmit={false}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="default"
        multiline={!false}
        scrollEnabled={false}
      >
        {blocks.map((block, i) => (
          <StyledText
            key={`${row.id}-${i}`}
            textStyles={block.styles}
            text={block.text}
            type={row.type}
            isCompleted={row.isCompleted}
          />
        ))}
      </TextInput>
    )
  }
}

export default StyledInput