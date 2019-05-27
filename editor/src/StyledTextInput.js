import React from 'react';
import { TextInput, View } from 'react-native';

import StyledText from "./StyledText";

class StyledInput extends React.Component {

  state = {
    now: null,
    hide: false
  }

  input = null

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

    this.setState({ now: Date.now() })

    setTimeout(() => {
      this.forceUpdate()
    }, 100);
  }

  focus = () => {
    if(this.input) {
      this.input.focus()
    }
  }

  refresh = ({ focus = false } = {}) => {
    this.setState({ hide: true }, () => {
      setTimeout(() => {
        this.setState({ hide: false }, () => {
          if(focus) {
            this.input.focus()
          }
        })
      }, 0);
    })
  }
  
  onEndEditing = () => {
    this.refresh()
  }
  
  stylesChanged = () => {
    this.refresh({ focus: true })
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
        onChangeText={onChangeText({ row, index })}
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