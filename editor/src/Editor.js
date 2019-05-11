import React from 'react';
import _ from 'lodash';
import { Text, View, ActivityIndicator, TextInput, FlatList, Keyboard } from 'react-native';

import { ActionSheet } from "native-base";

import {
  generateId,
  getCurrentBlockInRow,
  removeSelectedText,
  insertAt,
  attachStylesToSelected,
  mergeNewStyles,
  contentState,
  getSelectedBlocks
} from "./Helpers";

import { convertToMarkdown, convertToRaw, convertFromRaw } from "./Converters";

import getEmitter from "./EventEmitter";
import EVENTS from "./Events";

import styles from "./Styles";
import StyledText from "./StyledText";

import { ROW_TYPES } from "./Constants";

const eventEmitter = getEmitter()

const listeners = {}

const isListRow = type => type === ROW_TYPES.BULLETS || type === ROW_TYPES.NUMBERS

class Editor extends React.Component {

  textInputRefs = []
  refs = []

  lastBlock = {}

  state = {
    isReady: false,
    blocks: [],
    extraData: null,
    activeRowIndex: 0,
    selection: { start: 1, end: 1 },
    activeStyles: [],
  }

  componentDidMount() {
    listeners.hideKeyboard = eventEmitter.addListener(EVENTS.HIDE_KEYBOARD, this.hideKeyboard)
    listeners.showInsertRow = eventEmitter.addListener(EVENTS.SHOW_INSERT_BLOCK, this.showInsertRow)
    listeners.deleteActiveRow = eventEmitter.addListener(EVENTS.DELETE_BLOCK, this.deleteActiveRow)
    listeners.switchRowType = eventEmitter.addListener(EVENTS.CHANGE_BLOCK_TYPE, this.switchRowType)
    listeners.toggleStyle = eventEmitter.addListener(EVENTS.TOGGLE_STYLE, this.toggleStyle)
    listeners.changeRowIndex = eventEmitter.addListener(EVENTS.CHANGE_BLOCK_INDEX, this.changeRowIndex)
    listeners.changeRowIndent = eventEmitter.addListener(EVENTS.CHANGE_BLOCK_INDENT, this.changeRowIndent)
    listeners.duplicateRow = eventEmitter.addListener(EVENTS.DUPLICATE_ROW, this.duplicateRow)
    
    
    listeners.logState = eventEmitter.addListener(EVENTS.LOG_STATE, () => {
      console.tron.display({
        name: 'STATE',
        value: { props: this.state },
      })
    })
    
    listeners.duplicateRow = eventEmitter.addListener(EVENTS.CONVERT_TO_RAW, () => {
      const data = convertToRaw({ rows: this.state.blocks })
      const markdown = convertToMarkdown({ rows: this.state.blocks })
      console.tron.display({
        name: 'convertToRaw',
        value: { data, markdown },
      })
    })

    this.initialize()
  }

  // componentDidUpdate(prevProps, prevState, snapshot) {
  //   const { blocks: rows } = this.state
  //   const contentStateChanged = !_.isEqual(prevState.blocks, rows)
  //   if(contentStateChanged) {
  //     console.log('contentStateChanged::', contentStateChanged)
  //   }
  // }

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


  initialize () {
    // const blocks = convertFromRaw({ contentState })
    // const { data = {} } = this.props // convertFromRaw({ contentState })
    
    // const blocks = convertFromRaw({ contentState: data })
    // this.setState({ blocks, isReady: true })

    // console.log(data)
    // this.insertRow()

    
    const blocks = [{
      id: generateId(),
      type: ROW_TYPES.TEXT,
      value: "I have an array with a list of objects.",
      blocks: [
        { text: "I " },
        { text: "have " },
        { text: "an " },
        { text: "array " },
        { text: "with " },
        { text: "a " },
        { text: "list " },
        { text: "of " },
        { text: "objects." },
      ]
    }]

    this.setState({ blocks, isReady: true })
  }

  hideKeyboard () {
    Keyboard.dismiss()
  }
  
  deleteActiveRow = () => {
    const { activeRowIndex, blocks } = this.state
    if(activeRowIndex !== null && blocks.length > 1) {
      this.removeRow({ index: activeRowIndex, focusPrev: true })
    } else {
      blocks[0] = { id: generateId(), type: ROW_TYPES.TEXT, extraData: Date.now() }
      this.setState({ blocks, extraData: Date.now() }, () => {
        this.emitOnChange()
        setTimeout(() => {
          this.focusRow({ index: 0 })
        });
      })
    }
  }
  
  switchRowType = () => {
    const { activeRowIndex, blocks } = this.state

    if(activeRowIndex === null) {
      return
    }

    const activeRow = blocks[activeRowIndex]

    var BUTTONS = {
      text:"Paragraph",
      [ROW_TYPES.HEADING1]:"Heading 1",
      [ROW_TYPES.HEADING2]:"Heading 2",
      [ROW_TYPES.HEADING3]:"Heading 3",
      blockquote:"Blockquote",
      bullets:"Bulleted List",
      numbers:"Numbered List",
      cancel: 'Cancel'
    };
    var CANCEL_INDEX = Object.values(BUTTONS).length-1;
    var DESTRUCTIVE_INDEX = Object.keys(BUTTONS).indexOf(activeRow.type);

    ActionSheet.show({
        options: Object.values(BUTTONS),
        cancelButtonIndex: CANCEL_INDEX,
        destructiveButtonIndex: DESTRUCTIVE_INDEX,
        title: "Change Block Type"
    }, i => {
      const keys = Object.keys(BUTTONS)
      if (keys[i] === 'text') {
        this.changeRowType({ index: activeRowIndex, type: ROW_TYPES.TEXT })
      }
      if (keys[i] === ROW_TYPES.HEADING1) {
        this.changeRowType({ index: activeRowIndex, type: ROW_TYPES.HEADING1 })
      }
      if (keys[i] === ROW_TYPES.HEADING2) {
        this.changeRowType({ index: activeRowIndex, type: ROW_TYPES.HEADING2 })
      }
      if (keys[i] === ROW_TYPES.HEADING3) {
        this.changeRowType({ index: activeRowIndex, type: ROW_TYPES.HEADING3 })
      }
      if (keys[i] === 'blockquote') {
        this.changeRowType({ index: activeRowIndex, type: ROW_TYPES.BLOCKQUOTE })
      }
      if (keys[i] === 'bullets') {
        this.changeRowType({ index: activeRowIndex, type: ROW_TYPES.BULLETS })
      }
      if (keys[i] === 'numbers') {
        this.changeRowType({ index: activeRowIndex, type: ROW_TYPES.NUMBERS })
      }
    })
  }
  
  showInsertRow = () => {
    var BUTTONS = {
      paragraph:"Paragraph",
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
      if (keys[i] === 'paragraph') {
        this.insertRow({ focus: true })
      }
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
        this.insertRow({ type: ROW_TYPES.BLOCKQUOTE, focus: true, insertAfterActive: true })
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
    const { activeStyles, selection, activeRowIndex, blocks } = this.state

    const activeRow = blocks[activeRowIndex]
    style = style.toLowerCase()
    const isActive = activeStyles.includes(style)
    const oldStyles = activeStyles

    let newActiveStyles = []

    if (isActive) {
      newActiveStyles = activeStyles.filter(i => i.toLowerCase() !== style)
      this.setState({ activeStyles: newActiveStyles })
      this.emitActiveStyles({activeStyles: newActiveStyles})
    } else {
      activeStyles.push(style)
      newActiveStyles = activeStyles
      this.setState({ activeStyles: activeStyles })
      this.emitActiveStyles({activeStyles})
    }

    
    if(activeRowIndex !== null && selection.start < selection.end && selection.id === activeRow.id) {
      console.log("Changing block styles")
      const data = attachStylesToSelected({ selection, row: activeRow, newStyles: newActiveStyles, oldStyles })
      activeRow.blocks = data.blocks
      let newBlocks = [].concat(blocks)
      newBlocks[activeRowIndex] = activeRow
      this.setState({ blocks: newBlocks, extraData: Date.now() }, () => {
        this.emitOnChange()
      })
    } else {
      this.setState({ activeStyles: newActiveStyles })
    }
  }

  duplicateRow = () => {
    const { activeRowIndex, blocks } = this.state

    if(activeRowIndex === null) {
      return
    }

    const activeRow = blocks[activeRowIndex]
    const newBlockData = {...activeRow, id: generateId()}

    this.insertRow({ newBlockData, insertAfterActive: true, focus: true })
  }

  emitActiveStyles = ({ activeStyles, updateState = false } = {}) => {
    activeStyles = activeStyles || this.state.activeStyles
    getEmitter().emit(EVENTS.ACTIVE_STYLE_CHANGED, { activeStyles })

    if(updateState) {
      this.setState({ activeStyles })
    }
  }
  
  changeRowIndex = ({ direction }) => {
    const { activeRowIndex, blocks } = this.state
    if(activeRowIndex === null) {
      return
    }

    const currentBlock = blocks[activeRowIndex]

    if(direction === 'up') {
      const prevBlock = blocks[activeRowIndex-1]
      if(prevBlock) {
        blocks[activeRowIndex-1] = currentBlock
        blocks[activeRowIndex] = prevBlock
        this.setState({ blocks, extraData: Date.now() }, () => {
          this.focusRow({ index: activeRowIndex-1 })
          this.emitOnChange()
        })
      }
    }
    
    if(direction === 'down') {
      const nextBlock = blocks[activeRowIndex+1]
      if(nextBlock) {
        blocks[activeRowIndex+1] = currentBlock
        blocks[activeRowIndex] = nextBlock
        this.focusRow({ index: activeRowIndex+1 })
        this.setState({ blocks, extraData: Date.now() }, () => {
          this.emitOnChange()
          setTimeout(() => {
            this.focusRow({ index: activeRowIndex+1 })
          }, 100);
        })
      }
    }
  }
  
  changeRowIndent = ({ direction }) => {
    const { activeRowIndex, blocks } = this.state
    if(activeRowIndex === null) {
      return
    }

    const currentBlock = blocks[activeRowIndex]

    if(direction === 'increase') {
      currentBlock.value = `      ${currentBlock.value || ''}`
      blocks[activeRowIndex] = currentBlock
      this.setState({ blocks, extraData: Date.now() })
    }
    
    if(direction === 'decrease') {
      let value = currentBlock.value || ''
      if(value.substring(0,6) === '      ') {
        value = value.slice(6, value.length);
        currentBlock.value = value
        blocks[activeRowIndex] = currentBlock
        this.setState({ blocks, extraData: Date.now() })
      }
    }
  }

  onSubmitEditing = ({ item, index }) => () => {
    const { blocks: rows } = this.state

    const nextBlock = rows[index+1]
    if(!item.value && isListRow(item.type)) {
      this.changeRowType({ index, type: ROW_TYPES.TEXT })
    } else if (nextBlock && isListRow(item.type)) {
      this.insertRow({ focus: true, currentBlock: item, insertAfterActive: true })
    } else if (nextBlock){
      // this.focusRow({ index: index+1 })
      this.insertRow({ focus: true, insertAfterActive: true })
    } else {
      this.insertRow({ focus: true, currentBlock: item })
    }
  }
  
  onChangeText = ({ item, index }) => (val) => {
    const { blocks, activeStyles } = this.state
    blocks[index].value = (val || '').replace(/\n/g, '')
    this.setState({ blocks, extraData: Date.now() })
  }

  handleBackspace = ({ row: item, index }) => {
    const { selection, blocks: rows } = this.state
    let row = Object.assign({}, item)
    const { value = '', blocks = [] } = row

    if (selection.start < selection.end) {
      const newBlocks = removeSelectedText({ selection, row }) 
      row.blocks = newBlocks
    } else if(!value.length) {
      this.removeRow({ index, focusPrev: true })
    } else if(value.length === 1) {
      this.removeRow({ index, focusPrev: true })
    } else {
      const newBlocks = removeSelectedText({ selection, row }) 
      let newRows = [].concat(rows)
      newRows[index].blocks = newBlocks
      this.setState({ blocks: newRows })

      console.tron.display({
        name: 'Backspace',
        value: { blocks, newRows },
      })
    }
  }

  handleKeyPress = ({ row: item, index }) => ({ nativeEvent: { key: keyValue }, ...rest }) => {
    const { blocks: rows = [], selection, activeStyles } = this.state
    let row = Object.assign({}, item)
    const currentRow = rows[index]
    let { blocks = [] } = currentRow

    console.log("handleKeyPress fired::", keyValue)

    if (keyValue === 'Backspace') {
      this.handleBackspace({ row, index })
    } else if (keyValue === 'Enter') {
      this.setState({ selection: { start: 1, end: 1 } })
    } else if (keyValue === 'Tab') {
      // TODO: indent
    } else {
      
      // If there is selected text, remove first
      if (selection.start < selection.end) {
        const newRowBlocks = removeSelectedText({ selection, row }) 
        row.blocks = newRowBlocks
      }

      const currentBlock = getCurrentBlockInRow({ selection, row })

      const { 
        block: {
            text: blockText = '', 
            styles: currentStyles = []
        } = {},
        blockIndex,
        pointerAt
      } = currentBlock

      console.tron.display({
        name: 'currentBlock',
        value: { props: currentBlock },
      })
    
      const isStylesChanged = !_.isEqual(activeStyles, currentStyles)
      
      let newBlocks = [].concat(blocks)

      if (isStylesChanged) {
        let prevBlocks = blocks.slice(0, blockIndex) || []
        let nextBlocks = blocks.slice(blockIndex+1) || []
        
        const newCharBlocks = []

        console.tron.display({
          name: 'stylesChanged',
          value: { currentStyles, activeStyles, currentBlock },
        })

        console.log("stylesChanged..", currentStyles, activeStyles, currentBlock)

        const beforeBlockText = blockText.substring(0, pointerAt)
        const afterBlockText = blockText.substring(pointerAt, blockText.length)
        
        if(beforeBlockText && beforeBlockText.length > 0) {
          const prevBlock = { text: beforeBlockText, styles: currentStyles }
          newCharBlocks.push(prevBlock)
        }

        const newBlock = { text: keyValue, styles: activeStyles }
        newCharBlocks.push(newBlock)
  
        if(afterBlockText && afterBlockText.length > 0) {
          const nextBlock = { text: afterBlockText, styles: currentStyles }
          newCharBlocks.push(nextBlock)
        }
        
        newBlocks = [...prevBlocks, ...newCharBlocks, ...nextBlocks]
        console.tron.display({
          name: 'newCharBlocks',
          value: { newCharBlocks, newBlocks },
        })

        // this.emitActiveStyles({ activeStyles: activeStyles, updateState: true })
      } else {
        const newBlockText = insertAt(blockText, keyValue, pointerAt)
        
        if (!newBlocks[blockIndex]) {
          newBlocks[blockIndex] = {}
        }

        newBlocks[blockIndex].text = newBlockText

        // this.emitActiveStyles({ activeStyles: currentStyles, updateState: true })
      }

      let newRows = [].concat(rows)
      newRows[index].blocks = newBlocks

      this.setState({ blocks: newRows, extraData: Date.now() })
    }

    this.emitOnChange()
  }

  onSelectionChange = ({ item: row, index }) => (event) => {
    const { selection } = event.nativeEvent
    const { blocks: rows, activeRowIndex } = this.state
    
    selection.id = row.id
    this.setState({ selection })
    
    if (selection.start === selection.end && activeRowIndex !== null) {
      const row = rows[activeRowIndex]
      if(row && row.value) {
        const { block: { styles: blockStyles = [] } = {}, position } = getCurrentBlockInRow({ selection, row })
        let activeStyles = blockStyles

        // if(position === 'end') {
        //   const lastBlockIndex = row.blocks.length-1
        //   lastBlock = row.blocks[lastBlockIndex] || { styles: [] }
        //   activeStyles = blockStyles.concat(lastBlock.styles || [])
        // }

        this.emitActiveStyles({ activeStyles, updateState: true })
      }
    } else {
      const { startBlock, endBlock } = getSelectedBlocks({ selection, row })
      const { blocks } = row

      const blockStyles = []

      for (let i = startBlock.blockIndex; i <= endBlock.blockIndex; i++) {
        const block = blocks[i];
        const { styles = [], text = '' } = block
        if(text && text !== ' ') {
          blockStyles.push(styles)
        }
      }

      const commonStyles = _.intersection(...blockStyles);
      this.emitActiveStyles({ activeStyles: commonStyles, updateState: true })
    }
  }
  
  onFocus = ({ item, index }) => (e) => {
    this.setState({ activeRowIndex: index  })
    this.checkRowTypeChanged()
  }
  
  onBlur = ({ item, index }) => (e) => {
    this.setState({ activeRowIndex: null  })
  }

  checkRowTypeChanged = () => {
    const { activeRowIndex, blocks } = this.state
    const activeRow = blocks[activeRowIndex] || {}
    const { type = '' } = activeRow
    getEmitter().emit(EVENTS.ROW_TYPE_CHANGED, { type })
  }

  focusRow ({ index, timeout = 0 }) {
    const { blocks, activeStyles } = this.state
    const input = this.textInputRefs[index]
    if(input) {
      const row = blocks[index]
      let newStyles = activeStyles
      if(!row.value) {
        newStyles = []
      }
      this.setState({ activeRowIndex: index, activeStyles: newStyles })
      setTimeout(() => { input.focus() }, timeout);
      this.checkRowTypeChanged()
    }
  }

  insertRow ({ type = ROW_TYPES.TEXT, focus = false, currentBlock, insertAtActive = false, insertAfterActive = false, newBlockData } = {}) {
    let { blocks, activeRowIndex } = this.state

    let newBlockType = type

    if(currentBlock) {
      if(currentBlock.type === ROW_TYPES.BULLETS) {
        newBlockType = ROW_TYPES.BULLETS
      }
      if(currentBlock.type === ROW_TYPES.NUMBERS) {
        newBlockType = ROW_TYPES.NUMBERS
      }
    }
    
    const newBlock = newBlockData || { id: generateId(), type: newBlockType, blocks: [], extraData: Date.now() }
    
    let newBlockIndex

    if(activeRowIndex !== null && insertAtActive) {
      blocks.splice(activeRowIndex, 0, newBlock);
      newBlockIndex = activeRowIndex
    } else if(activeRowIndex !== null && insertAfterActive) {
      blocks.splice(activeRowIndex+1, 0, newBlock);
      newBlockIndex = activeRowIndex+1
    } else {
      blocks.push(newBlock)
      newBlockIndex = blocks.length - 1
    }

    this.setState({ blocks, extraData: Date.now(), activeStyles: [], selection: { start: 0, end: 0 } }, () => {
      this.emitActiveStyles()
      this.emitOnChange()
      setTimeout(() => {
        if(focus) {
          this.focusRow({ index: newBlockIndex })
        }
      });
    })
  }

  insertHeading = ({ heading }) => {
    const key = heading.toUpperCase()
    this.insertRow({ type: ROW_TYPES[key], focus: true, insertAfterActive: true })
  }
  
  insertList = ({ list }) => {
    const key = list.toUpperCase()
    this.insertRow({ type: ROW_TYPES[key], focus: true, insertAfterActive: true })
  }

  removeRow ({ index, focusPrev = false }, callback) {
    const { blocks } = this.state
    if(blocks.length > 1) {
      blocks.splice(index, 1)
      this.setState({ blocks, extraData: Date.now() }, () => {
        this.emitOnChange()
        setTimeout(() => {
          if(focusPrev) {
            this.focusRow({ index: index-1 })
          }
          if(callback) {
            callback()
          }
        });
      })
    }
  }

  emitOnChange = () => {
    const { onChange } = this.props
    if(onChange) {
      onChange(convertToRaw({ rows: this.state.blocks }))
    }
  }

  changeRowType ({ index, type }) {
    const { blocks } = this.state
    const block = blocks[index]
    if(block) {
      block.type = type
      block.extraData = Date.now()
      // If its heading row, remove styles
      if(type.includes('heading')) {
        block.blocks = block.blocks.map(item => ({ text: item.text }))
      }
      blocks[index] = block
      this.setState({ blocks, extraData: Date.now() }, () => {
        this.emitOnChange()
      })
      this.checkRowTypeChanged()
      this.focusRow({ index, timeout: 100 })
    }
  }

  getPlaceholder = ({ row, index }) => {
    const { blocks: rows } = this.state
    if(index === 0 && rows.length === 1) { //  && rows.length === 1
      return "Write..."
    }
    if(row.type === ROW_TYPES.HEADING1) {
      return 'Heading 1'
    }
    if(row.type === ROW_TYPES.HEADING2) {
      return 'Heading 2'
    }
    if(row.type === ROW_TYPES.HEADING3) {
      return 'Heading 3'
    }
    if(row.type === ROW_TYPES.BLOCKQUOTE) {
      return 'Blockquote'
    }
    if(row.type === ROW_TYPES.BULLETS) {
      return 'List'
    }
    if(row.type === ROW_TYPES.NUMBERS) {
      return 'List'
    }
    return ''
  }
  
  getInputStyles = ({ row, index }) => {
    if(row.type === ROW_TYPES.HEADING1) {
      return styles.heading1
    }
    if(row.type === ROW_TYPES.HEADING2) {
      return styles.heading2
    }
    if(row.type === ROW_TYPES.HEADING3) {
      return styles.heading3
    }
    if(row.type === ROW_TYPES.BLOCKQUOTE) {
      return styles.blockquote
    }
    return {}
  }
  
  getNumberOrder = ({ index }) => {
    const { blocks } = this.state
    let numberOrder = 0
    for (let i = index; i >= 0; i--) {
      const block = blocks[i];
      if(block.type !== ROW_TYPES.NUMBERS) {
        break
      }
      numberOrder+=1
    }
    return numberOrder
  }
  
  renderItem = ({ item: row, index }) => {
    const { selection } = this.state

    const placeholder = this.getPlaceholder({ row, index })
    const inputStyles = this.getInputStyles({ row, index })

    const isBullet = row.type === ROW_TYPES.BULLETS
    const isNumbers = row.type === ROW_TYPES.NUMBERS
    const numberOrder = this.getNumberOrder({row, index})

    const { blocks = [] } = row

    let selectionProp = {}

    if(selection.start < selection.end) {
      // selectionProp = {
      //   selection: selection
      // }
    }

    return (
      <View style={styles.row}>
        {isBullet && <Text style={styles.bullet}>•</Text>}
        {isNumbers && <Text style={styles.numberOrder}>{numberOrder}.</Text>}
        <TextInput
          underlineColorAndroid="transparent"
          ref={(input) => { this.textInputRefs[index] = input; }}
          placeholder={placeholder}
          onSubmitEditing={this.onSubmitEditing({ item: row, index })}
          blurOnSubmit={true}
          onChangeText={this.onChangeText({ item: row, index })}
          onKeyPress={this.handleKeyPress({ row, index })}
          style={[styles.textInput, inputStyles]}
          onFocus={this.onFocus({ item: row, index })}
          onBlur={this.onBlur({ item: row, index })}
          onSelectionChange={this.onSelectionChange({ item: row, index })}
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="default"
          multiline={!false}
          scrollEnabled={false}
          {...selectionProp}
        >
          {blocks.map((block, i) => (
            <StyledText
              key={`${row.id}-${i}`}
              textStyles={block.styles}
              text={block.text}
              type={row.type}
            />
          ))}
        </TextInput>
      </View>
    )
  }

  renderLoading = () => {
    return (
      <View>
        <ActivityIndicator size="small" />
      </View>
    )
  }

  render() {
    const { blocks, extraData, isReady } = this.state

    // console.log(JSON.stringify(this.state.blocks))
    // console.log("blocks", blocks)

    if(!isReady) {
      return this.renderLoading()
    }

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