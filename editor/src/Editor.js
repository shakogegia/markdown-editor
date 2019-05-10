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

  // componentWillMount() {
  //   this.initialize()
  // }

  componentDidMount() {
    listeners.hideKeyboard = eventEmitter.addListener(EVENTS.HIDE_KEYBOARD, this.hideKeyboard)
    listeners.showInsertRow = eventEmitter.addListener(EVENTS.SHOW_INSERT_BLOCK, this.showInsertRow)
    listeners.deleteActiveRow = eventEmitter.addListener(EVENTS.DELETE_BLOCK, this.deleteActiveRow)
    listeners.switchRowType = eventEmitter.addListener(EVENTS.CHANGE_BLOCK_TYPE, this.switchRowType)
    listeners.toggleStyle = eventEmitter.addListener(EVENTS.TOGGLE_STYLE, this.toggleStyle)
    listeners.changeRowIndex = eventEmitter.addListener(EVENTS.CHANGE_BLOCK_INDEX, this.changeRowIndex)
    listeners.changeRowIndent = eventEmitter.addListener(EVENTS.CHANGE_BLOCK_INDENT, this.changeRowIndent)
    listeners.duplicateRow = eventEmitter.addListener(EVENTS.DUPLICATE_ROW, this.duplicateRow)
    
    
    listeners.duplicateRow = eventEmitter.addListener(EVENTS.LOG_STATE, () => {
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

    // setTimeout(() => {
    //   convertToRaw(this.state.blocks)
    // }, 1000);

    this.initialize()
  }

  // componentDidUpdate(prevProps, prevState, snapshot) {
  // }

  componentWillUnmount() {
    listeners.forEach(listener => {
      listener.remove()
    })
  }


  initialize () {
    // const blocks = convertFromRaw({ contentState })
    const { data = {} } = this.props // convertFromRaw({ contentState })
    
    const blocks = convertFromRaw({ contentState: data })
    this.setState({ blocks, isReady: true })

    // console.log(data)
    // this.insertRow()

    
    // const blocks = [{
    //   id: generateId(),
    //   type: ROW_TYPES.TEXT,
    //   value: "I have an array with a list of objects.",
    //   blocks: [
    //     { text: "I " },
    //     { text: "have " },
    //     { text: "an " },
    //     { text: "array " },
    //     { text: "with " },
    //     { text: "a " },
    //     { text: "list " },
    //     { text: "of " },
    //     { text: "objects." },
    //   ]
    // }]

    // this.setState({ blocks })
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

      // const before = activeRow.value.substring(0, selection.start)
      // const text = activeRow.value.substring(selection.start, selection.end)
      // const after = activeRow.value.substring(selection.end, activeRow.value.length)
      // activeRow.blocks = [ {text: before}, {text, styles: newActiveStyles} , {text: after}  ]
      // blocks[activeRowIndex] = activeRow
      // console.log("Selected::", before, text, after)
      // console.log(blocks)
      
      const data = attachStylesToSelected({ selection, row: activeRow, newStyles: newActiveStyles, oldStyles })
      activeRow.blocks = data.blocks
      blocks[activeRowIndex] = activeRow
      this.setState({ blocks, extraData: Date.now() }, () => {
        this.emitOnChange()
      })

      // console.tron.display({
      //   name: 'attachStylesToSelected',
      //   value: { data },
      // })
      
      // this.setState({ blocks, extraData: Date.now(), selection: { start: selection.end, end: selection.end,  } })

    } else {
      // console.log(selection, activeRow.id, activeRowIndex !== null , selection.start < selection.end , selection.id === activeRow.id)
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
    const { blocks } = this.state

    const nextBlock = blocks[index+1]
    // const prevBlock = blocks[index-1]

    // blocks[index].value = (item.value || '').replace(/\n/g, '')
    // this.setState({ blocks, extraData: Date.now() })

    if(!item.value && isListRow(item.type)) {
      // this.removeRow({ index, focusPrev: false }, () => {
      //   this.insertRow({ index: index+1, focus: true })
      // }) 
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
    if(!val) {
      // this.removeRow({ index, focusPrev: true })
    } else {
      // var lastChar = myString.substr(myString.length -1)

      // const data = getCurrentBlockInRow(this.state)
      // // console.log(data)

      // const row = item
      // row.value = val.replace(/\n/g, '')
      // // row.blocks[data.index] = 
      // console.log(row.blocks[data.index])

      blocks[index].value = val.replace(/\n/g, '')
      this.setState({ blocks, extraData: Date.now() })
    }
  }

  handleKeyPress = ({ row, index }) => ({ nativeEvent: { key: keyValue }, ...rest }) => {
    const { blocks: rows, selection, activeStyles } = this.state
    const currentRow = rows[index]
    const { value = '' } = currentRow

    console.log("handleKeyPress fired")

    if (keyValue === 'Backspace') {
      if(!value.length) {
        this.removeRow({ index, focusPrev: true })
      } else if(value.length === 1) {
        this.removeRow({ index, focusPrev: true })
      } else {
        const blocks = removeSelectedText({ selection, row }) 
        console.tron.display({
          name: 'Backspace',
          value: { blocks },
        })

        rows[index].blocks = blocks
        this.setState({ blocks: rows })
      }
    } else if (keyValue === 'Enter') {
      this.setState({ selection: { start: 1, end: 1 } })
    } else {
      const currentBlock = getCurrentBlockInRow({ selection, row })

      console.tron.display({
        name: 'currentBlock',
        value: { props: currentBlock },
      })
      
      const { blocks = [] } = row

      // const blockText = blocks[currentBlock.blockIndex] ? blocks[currentBlock.blockIndex].text : ''
      // const newBlockText = insertAt(blockText, keyValue, currentBlock.pointerAt)
      // blocks[currentBlock.blockIndex].text = newBlockText

      const { text: blockText = '',  styles: currentStyles = [] } = currentBlock.block || {}
      const stylesChanged = !_.isEqual(activeStyles, currentStyles)
      const stylesChanged2 = activeStyles.sort((a, b) => a - b).join().toLocaleLowerCase() !== currentStyles.sort((a, b) => a - b).join().toLocaleLowerCase()
      
      let newBlocks = blocks

      if (stylesChanged) {
        console.log("stylesChanged..", currentStyles, activeStyles, currentBlock)

        let p1 = blocks.slice(0, currentBlock.blockIndex)
        let p2 = blocks.slice(currentBlock.blockIndex+1)
        
        const newCharBlocks = []

        const { text: blockText = '',  styles: currentStyles = [] } = currentBlock.block || {}


        const blockPrevText = blockText.substring(0, currentBlock.pointerAt)
        const blockNextText = blockText.substring(currentBlock.pointerAt, blockText.length)
                
        const prevBlock = { text: blockPrevText, styles: currentStyles }
        const newBlock = { text: keyValue, styles: activeStyles }
        const nextBlock = { text: blockNextText, styles: currentStyles }

        newCharBlocks.push(prevBlock)
        newCharBlocks.push(newBlock)
        if(blockNextText) {
          newCharBlocks.push(nextBlock)
        }
        
        newBlocks = [...p1, ...newCharBlocks, ...p2]

        console.tron.display({
          name: 'newCharBlocks',
          value: { newCharBlocks, p1, p2,  },
        })

      } else {
        const blockText = blocks[currentBlock.blockIndex] ? blocks[currentBlock.blockIndex].text : ''
        const newBlockText = insertAt(blockText, keyValue, currentBlock.pointerAt)
        
        if (!newBlocks[currentBlock.blockIndex]) {
          newBlocks[currentBlock.blockIndex] = {}
        }

        newBlocks[currentBlock.blockIndex].text = newBlockText
      }

      // console.log("Insert::", blockText, keyValue, currentBlock.pointerAt, newBlockText)
      // console.log(blockText, blockText.substring(0, currentBlock.pointerAt), currentBlock.pointerAt, newBlockText)
      
      // blocks[index].blocks = blocks
      rows[index].blocks = newBlocks

      this.setState({ blocks: rows })
    }

    this.emitOnChange()
  }

  onSelectionChange = ({ item, index }) => (event) => {
    const { selection } = event.nativeEvent
    const { blocks, activeRowIndex } = this.state
    
    selection.id = item.id
    this.setState({ selection })
    
    if (selection.start === selection.end && activeRowIndex !== null) {
      const activeRow = blocks[activeRowIndex]
      if(activeRow && activeRow.value) {
        const beforePointerText = activeRow.value.substring(0, selection.start)
        const { blocks = [] } = activeRow
        let text = ""
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];

          text += block.text
          if(text.length >= beforePointerText.length) {
            const blockStyles = block.styles || []
            this.emitActiveStyles({ activeStyles: blockStyles, updateState: true })
            break;
          }
        }
      }
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
    const input = this.textInputRefs[index]
    if(input) {
      this.setState({ activeRowIndex: index })
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
    
    const newBlock = newBlockData || { id: generateId(), type: newBlockType, extraData: Date.now() }
    
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

    this.setState({ blocks, extraData: Date.now(), activeStyles: [] }, () => {
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
    const { blocks } = this.state
    if(index === 0) { //  && blocks.length === 1
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
    return 'Placeholder'
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