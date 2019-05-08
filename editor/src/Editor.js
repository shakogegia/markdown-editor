import React from 'react';
import _ from 'lodash';
import { Text, View, TextInput, FlatList, Keyboard, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

import Markdown from 'react-native-easy-markdown';

import { ActionSheet } from "native-base";

import { generateId, convertFromRaw, convertToRaw } from "./Helpers";

import getEmitter from "./EventEmitter";
import EVENTS from "./Events";

import styles from "./Styles";
import StyledText from "./StyledText";

const BLOCK_TYPES = {
  TEXT: 'text',
  HEADING1: 'heading1',
  HEADING2: 'heading2',
  HEADING3: 'heading3',
  BLOCKQUOTE: 'blockquote',
  BULLETS: 'bullets',
  NUMBERS: 'numbers',
  NUMBERS: 'numbers',
}

const eventEmitter = getEmitter()

const listeners = {}

const isListBlock = type => type === BLOCK_TYPES.BULLETS || type === BLOCK_TYPES.NUMBERS

class Editor extends React.Component {

  textInputRefs = []
  refs = []

  lastBlock = {}

  state = {
    blocks: [],
    extraData: null,
    activeIndex: 0,
    selection: {},
    activeStyles: []
  }

  componentWillMount() {
    this.initialize()
  }

  componentDidMount() {
    listeners.hideKeyboard = getEmitter().addListener(EVENTS.HIDE_KEYBOARD, this.hideKeyboard)
    listeners.showInsertBlock = getEmitter().addListener(EVENTS.SHOW_INSERT_BLOCK, this.showInsertBlock)
    listeners.deleteActiveBlock = getEmitter().addListener(EVENTS.DELETE_BLOCK, this.deleteActiveBlock)
    listeners.switchBlockType = getEmitter().addListener(EVENTS.CHANGE_BLOCK_TYPE, this.switchBlockType)
    listeners.toggleStyle = getEmitter().addListener(EVENTS.TOGGLE_STYLE, this.toggleStyle)
    listeners.changeBlockIndex = getEmitter().addListener(EVENTS.CHANGE_BLOCK_INDEX, this.changeBlockIndex)
    listeners.changeBlockIndent = getEmitter().addListener(EVENTS.CHANGE_BLOCK_INDENT, this.changeBlockIndent)
    listeners.duplicateRow = getEmitter().addListener(EVENTS.DUPLICATE_ROW, this.duplicateRow)

    // setTimeout(() => {
    //   convertToRaw(this.state.blocks)
    // }, 1000);
  }

  componentWillUnmount() {
    listeners.forEach(listener => {
      listener.remove()
    })
  }


  initialize () {
    // const blocks = convertFromRaw()
    // this.setState({ blocks })
    // console.log(data)
    this.insertBlock()
  }

  hideKeyboard () {
    Keyboard.dismiss()
  }
  
  deleteActiveBlock = () => {
    const { activeIndex, blocks } = this.state
    if(activeIndex !== null && blocks.length > 1) {
      this.removeBlock({ index: activeIndex, focusPrev: true })
    } else {
      blocks[0] = { id: generateId(), type: BLOCK_TYPES.TEXT, extraData: Date.now() }
      this.setState({ blocks, extraData: Date.now() }, () => {
        setTimeout(() => {
          this.focusBlock({ index: 0 })
        });
      })
    }
  }
  
  switchBlockType = () => {
    const { activeIndex, blocks } = this.state

    if(activeIndex === null) {
      return
    }

    const activeBlock = blocks[activeIndex]

    var BUTTONS = {
      text:"Body",
      [BLOCK_TYPES.HEADING1]:"Heading 1",
      [BLOCK_TYPES.HEADING2]:"Heading 2",
      [BLOCK_TYPES.HEADING3]:"Heading 3",
      blockquote:"Blockquote",
      bullets:"Bulleted List",
      numbers:"Numbered List",
      cancel: 'Cancel'
    };
    var CANCEL_INDEX = Object.values(BUTTONS).length-1;
    var DESTRUCTIVE_INDEX = Object.keys(BUTTONS).indexOf(activeBlock.type);

    ActionSheet.show({
        options: Object.values(BUTTONS),
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
        title: "Change Block Type"
    }, i => {
      const keys = Object.keys(BUTTONS)
      if (keys[i] === 'text') {
        this.changeBlockType({ index: activeIndex, type: BLOCK_TYPES.TEXT })
      }
      if (keys[i] === BLOCK_TYPES.HEADING1) {
        this.changeBlockType({ index: activeIndex, type: BLOCK_TYPES.HEADING1 })
      }
      if (keys[i] === BLOCK_TYPES.HEADING2) {
        this.changeBlockType({ index: activeIndex, type: BLOCK_TYPES.HEADING2 })
      }
      if (keys[i] === BLOCK_TYPES.HEADING3) {
        this.changeBlockType({ index: activeIndex, type: BLOCK_TYPES.HEADING3 })
      }
      if (keys[i] === 'blockquote') {
        this.changeBlockType({ index: activeIndex, type: BLOCK_TYPES.BLOCKQUOTE })
      }
      if (keys[i] === 'bullets') {
        this.changeBlockType({ index: activeIndex, type: BLOCK_TYPES.BULLETS })
      }
      if (keys[i] === 'numbers') {
        this.changeBlockType({ index: activeIndex, type: BLOCK_TYPES.NUMBERS })
      }
    })
  }
  
  showInsertBlock = () => {
    var BUTTONS = {
      heading1:"Heading 1",
      heading2:"Heading 2",
      heading3:"Heading 3",
      blockquote: 'Blockquote',
      bullets:"Bulleted List",
      numbers:"Numbered List",
      cancel: 'Cancel'
    };
    var CANCEL_INDEX = Object.values(BUTTONS).length-1;
    var DESTRUCTIVE_INDEX = -1;

    ActionSheet.show({
        options: Object.values(BUTTONS),
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
        title: "Insert Block"
    }, i => {
      const keys = Object.keys(BUTTONS)
      if (keys[i] === 'heading1') {
        this.insertHeading({ heading: 'heading1' })
      }
      if (keys[i] === 'heading2') {
        this.insertHeading({ heading: 'heading2' })
      }
      if (keys[i] === 'heading3') {
        this.insertHeading({ heading: 'heading3' })
      }
      if (keys[i] === 'blockquote') {
        this.insertBlock({ type: BLOCK_TYPES.BLOCKQUOTE, focus: true, insertAfterActive: true })
      }
      if (keys[i] === 'bullets') {
        this.insertList({ list: 'bullets' })
      }
      if (keys[i] === 'numbers') {
        this.insertList({ list: 'numbers' })
      }
    })
  }

  toggleStyle = ({ style }) => {
    style = style.toLowerCase()
    const { activeStyles } = this.state
    const isActive = activeStyles.includes(style)
    if (isActive) {
      const newActiveStyles = activeStyles.filter(i => i.toLowerCase() !== style)
      this.setState({ activeStyles: newActiveStyles })
      this.emitActiveStyles({activeStyles: newActiveStyles})
    } else {
      activeStyles.push(style)
      this.setState({ activeStyles: activeStyles })
      this.emitActiveStyles({activeStyles})
    }
  }

  duplicateRow = () => {
    const { activeIndex, blocks } = this.state

    if(activeIndex === null) {
      return
    }

    const activeBlock = blocks[activeIndex]
    const newBlockData = {...activeBlock, id: generateId()}

    this.insertBlock({ newBlockData, insertAfterActive: true, focus: true })
  }

  emitActiveStyles = ({ activeStyles} = {}) => {
    activeStyles = activeStyles || this.state.activeStyles
    getEmitter().emit(EVENTS.ACTIVE_STYLE_CHANGED, { activeStyles })
  }
  
  changeBlockIndex = ({ direction }) => {
    const { activeIndex, blocks } = this.state
    if(activeIndex === null) {
      return
    }

    const currentBlock = blocks[activeIndex]

    if(direction === 'up') {
      const prevBlock = blocks[activeIndex-1]
      if(prevBlock) {
        blocks[activeIndex-1] = currentBlock
        blocks[activeIndex] = prevBlock
        this.setState({ blocks, extraData: Date.now() }, () => {
          this.focusBlock({ index: activeIndex-1 })
        })
      }
    }
    
    if(direction === 'down') {
      const nextBlock = blocks[activeIndex+1]
      if(nextBlock) {
        blocks[activeIndex+1] = currentBlock
        blocks[activeIndex] = nextBlock
        this.focusBlock({ index: activeIndex+1 })
        this.setState({ blocks, extraData: Date.now() }, () => {
          setTimeout(() => {
            this.focusBlock({ index: activeIndex+1 })
          }, 100);
        })
      }
    }
  }
  
  changeBlockIndent = ({ direction }) => {
    const { activeIndex, blocks } = this.state
    if(activeIndex === null) {
      return
    }

    const currentBlock = blocks[activeIndex]

    if(direction === 'increase') {
      currentBlock.value = `      ${currentBlock.value || ''}`
      blocks[activeIndex] = currentBlock
      this.setState({ blocks, extraData: Date.now() })
    }
    
    if(direction === 'decrease') {
      let value = currentBlock.value || ''
      if(value.substring(0,6) === '      ') {
        value = value.slice(6, value.length);
        currentBlock.value = value
        blocks[activeIndex] = currentBlock
        this.setState({ blocks, extraData: Date.now() })
      }
    }
  }

  onSubmitEditing = ({ item, index }) => () => {
    const { blocks } = this.state

    const nextBlock = blocks[index+1]
    // const prevBlock = blocks[index-1]

    if(!item.value && isListBlock(item.type)) {
      // this.removeBlock({ index, focusPrev: false }, () => {
      //   this.insertBlock({ index: index+1, focus: true })
      // }) 
      this.changeBlockType({ index, type: BLOCK_TYPES.TEXT })
    } else if (nextBlock && isListBlock(item.type)) {
      this.insertBlock({ focus: true, currentBlock: item, insertAfterActive: true })
    } else if (nextBlock){
      // this.focusBlock({ index: index+1 })
      this.insertBlock({ focus: true, insertAfterActive: true })
    } else {
      this.insertBlock({ focus: true, currentBlock: item })
    }
  }
  
  onChangeText = ({ item, index }) => (val) => {
    const { blocks, activeStyles } = this.state

    if(!val) {
      // this.removeBlock({ index, focusPrev: true })
    } else {
      blocks[index].value = val
      this.setState({ blocks, extraData: Date.now() })
    }
  }

  handleKeyPress = ({ item, index }) => ({ nativeEvent: { key: keyValue }, ...rest }) => {
    const { blocks } = this.state
    const currentBlock = blocks[index]
    const { value = '' } = currentBlock

    if (keyValue === 'Backspace') {
      // console.log(value)
      
      // if (this.lastBlock
      //     && this.lastBlock.id === currentBlock.id
      //     && this.lastBlock.value === currentBlock.value
      //     && index > 0
      //   ) {
      //   const prevBlockIndex = index-1
      //   const prevBlock = blocks[prevBlockIndex]
      //   prevBlock.value = prevBlock.value || ''
      //   prevBlock.value += currentBlock.value
      //   blocks[prevBlockIndex] = prevBlock
      //   this.setState({ blocks })
      //   this.removeBlock({ index, focusPrev: true })
      //   return 
      // }

      if(!value.length) {
        this.removeBlock({ index, focusPrev: true })
      } else if(value.length === 1) {
        this.removeBlock({ index, focusPrev: true })
      }
    }
  }

  onSelectionChange = ({ item, index }) => (event) => {
    const { selection } = event.nativeEvent
    selection.id = item.id
    // console.log(selection)
    this.setState({ selection })
  }
  
  onFocus = ({ item, index }) => () => {
    this.setState({ activeIndex: index  })
  }
  
  onBlur = ({ item, index }) => () => {
    this.setState({ activeIndex: null  })
  }

  focusBlock ({ index }) {
    const input = this.textInputRefs[index]
    if(input) {
      this.setState({ activeIndex: index })
      input.focus()
    }
  }

  insertBlock ({ type = BLOCK_TYPES.TEXT, focus = false, currentBlock, insertAtActive = false, insertAfterActive = false, newBlockData } = {}) {
    let { blocks, activeIndex } = this.state

    let newBlockType = type

    if(currentBlock) {
      if(currentBlock.type === BLOCK_TYPES.BULLETS) {
        newBlockType = BLOCK_TYPES.BULLETS
      }
      if(currentBlock.type === BLOCK_TYPES.NUMBERS) {
        newBlockType = BLOCK_TYPES.NUMBERS
      }
    }
    
    const newBlock = newBlockData || { id: generateId(), type: newBlockType, extraData: Date.now() }
    
    let newBlockIndex

    if(activeIndex !== null && insertAtActive) {
      blocks.splice(activeIndex, 0, newBlock);
      newBlockIndex = activeIndex
    } else if(activeIndex !== null && insertAfterActive) {
      blocks.splice(activeIndex+1, 0, newBlock);
      newBlockIndex = activeIndex+1
    } else {
      blocks.push(newBlock)
      newBlockIndex = blocks.length - 1
    }

    this.setState({ blocks, extraData: Date.now(), activeStyles: [] }, () => {
      this.emitActiveStyles()
      setTimeout(() => {
        if(focus) {
          this.focusBlock({ index: newBlockIndex })
        }
      });
    })
  }

  insertHeading = ({ heading }) => {
    const key = heading.toUpperCase()
    this.insertBlock({ type: BLOCK_TYPES[key], focus: true, insertAfterActive: true })
  }
  
  insertList = ({ list }) => {
    const key = list.toUpperCase()
    this.insertBlock({ type: BLOCK_TYPES[key], focus: true, insertAfterActive: true })
  }

  removeBlock ({ index, focusPrev = false }, callback) {
    const { blocks } = this.state
    if(blocks.length > 1) {
      blocks.splice(index, 1)
      this.setState({ blocks, extraData: Date.now() }, () => {
        setTimeout(() => {
          if(focusPrev) {
            this.focusBlock({ index: index-1 })
          }
          if(callback) {
            callback()
          }
        });
      })
    }
  }

  changeBlockType ({ index, type }) {
    const { blocks } = this.state
    const block = blocks[index]
    if(block) {
      block.type = type
      block.extraData = Date.now()
      blocks[index] = block
      this.setState({ blocks, extraData: Date.now() })
    }
  }

  getPlaceholder = ({ item, index }) => {
    const { blocks } = this.state
    if(index === 0) { //  && blocks.length === 1
      return "Write..."
    }
    if(item.type === BLOCK_TYPES.HEADING1) {
      return 'Heading 1'
    }
    if(item.type === BLOCK_TYPES.HEADING2) {
      return 'Heading 2'
    }
    if(item.type === BLOCK_TYPES.HEADING3) {
      return 'Heading 3'
    }
    if(item.type === BLOCK_TYPES.BLOCKQUOTE) {
      return 'Blockquote'
    }
    if(item.type === BLOCK_TYPES.BULLETS) {
      return 'List'
    }
    if(item.type === BLOCK_TYPES.NUMBERS) {
      return 'List'
    }
    return 'Placeholder'
  }
  
  getInputStyles = ({ item, index }) => {
    if(item.type === BLOCK_TYPES.HEADING1) {
      return styles.heading1
    }
    if(item.type === BLOCK_TYPES.HEADING2) {
      return styles.heading2
    }
    if(item.type === BLOCK_TYPES.HEADING3) {
      return styles.heading3
    }
    if(item.type === BLOCK_TYPES.BLOCKQUOTE) {
      return styles.blockquote
    }
    return {}
  }
  
  getNumberOrder = ({ item, index }) => {
    const { blocks } = this.state
    let numberOrder = 0
    for (let i = index; i >= 0; i--) {
      const block = blocks[i];
      if(block.type !== BLOCK_TYPES.NUMBERS) {
        break
      }
      numberOrder+=1
    }
    return numberOrder
  }
  
  renderItem = ({ item, index }) => {
    const placeholder = this.getPlaceholder({ item, index })
    const inputStyles = this.getInputStyles({ item, index })

    const isBullet = item.type === BLOCK_TYPES.BULLETS
    const isNumbers = item.type === BLOCK_TYPES.NUMBERS
    const numberOrder = this.getNumberOrder({item, index})

    const { blocks = [] } = item

    return (
      <View style={styles.row}>
        {isBullet && <Text style={styles.bullet}>•</Text>}
        {isNumbers && <Text style={styles.numberOrder}>{numberOrder}.</Text>}
        <TextInput
          underlineColorAndroid="transparent"
          ref={(input) => { this.textInputRefs[index] = input; }}
          placeholder={placeholder}
          onSubmitEditing={this.onSubmitEditing({ item, index })}
          blurOnSubmit={false}
          onChangeText={this.onChangeText({ item, index })}
          onKeyPress={this.handleKeyPress({ item, index })}
          style={[styles.textInput, inputStyles]}
          onFocus={this.onFocus({ item, index })}
          onBlur={this.onBlur({ item, index })}
          onSelectionChange={this.onSelectionChange({ item, index })}
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
          multiline={false}
        >
          {/*
            {blocks.map((block, i) => (
              <StyledText
                key={`${item.id}-${i}`}
                textStyles={block.styles}
                text={block.text}
                type={item.type}
              />
            ))}
          */}

          <StyledText
            text={item.value}
            type={item.type}
          />
        </TextInput>
      </View>
    )
  }

  render() {
    const { blocks, extraData } = this.state

    // console.log("blocks", blocks)

    return (
      <FlatList
        data={blocks}
        keyExtractor={i => i.id}
        renderItem={this.renderItem}
        extraData={extraData}
        keyboardShouldPersistTaps={"always"}
        keyboardDismissMode="interactive"
        ListFooterComponent={this.renderFooter}
        contentContainerStyle={styles.contentContainerStyle}
        style={styles.flatList}
      />
    );
  }
}

export default Editor