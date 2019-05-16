import React from 'react';
import _ from 'lodash';
import { ImagePicker, Permissions } from 'expo';
import { Text, View, ActivityIndicator, TextInput, FlatList, Keyboard, Modal, SafeAreaView, Image, TouchableOpacity } from 'react-native';
import { ActionSheet, Container, Header, Body, Title } from "native-base";
import Lightbox from 'react-native-lightbox';
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import TextToolbar from "./TextToolbar";
import Sketch from "./Sketch";

import {
  generateId,
  getCurrentBlockInRow,
  removeSelectedText,
  insertAt,
  attachStylesToSelectedText,
  mergeNewStyles,
  contentState,
  getSelectedBlocks,
  splitRow
} from "./Helpers";

import { convertToMarkdown, convertToRaw, convertFromRaw, } from "./Convertors";

import getEmitter from "./EventEmitter";
import EVENTS from "./Events";

import styles from "./Styles";
import StyledText from "./StyledText";
import CheckBox from "./CheckBox";

import { ROW_TYPES } from "./Constants";


const eventEmitter = getEmitter()

const listeners = {}

const isListRow = type => type === ROW_TYPES.BULLETS || type === ROW_TYPES.NUMBERS || type === ROW_TYPES.TODOS

const history = []

class Editor extends React.Component {

  textInputRefs = []
  sketch = null
  refs = []

  lastBlock = {}
  
  state = {
    isReady: false,
    isFullscreen: false,
    isSketchVisible: false,
    rows: [],
    extraData: null,
    activeRowIndex: 0,
    selection: { start: 0, end: 0 },
    activeStyles: [],
  }

  componentDidMount() {
    listeners.hideKeyboard = eventEmitter.addListener(EVENTS.HIDE_KEYBOARD, this.hideKeyboard)
    listeners.toggleFullscreen = eventEmitter.addListener(EVENTS.TOGGLE_FULL_SCREEN, this.toggleFullscreen)
    listeners.showInsertRow = eventEmitter.addListener(EVENTS.SHOW_INSERT_BLOCK, this.showInsertRow)
    listeners.showUploadFile = eventEmitter.addListener(EVENTS.SHOW_UPLOAD_FILE, this.showUploadFile)
    listeners.toggleStyle = eventEmitter.addListener(EVENTS.TOGGLE_STYLE, this.toggleStyle)
    listeners.deleteActiveRow = eventEmitter.addListener(EVENTS.DELETE_BLOCK, this.deleteActiveRow)
    listeners.changeRowIndex = eventEmitter.addListener(EVENTS.CHANGE_BLOCK_INDEX, this.changeRowIndex)
    listeners.duplicateRow = eventEmitter.addListener(EVENTS.DUPLICATE_ROW, this.duplicateRow)
    listeners.showChangeRowType = eventEmitter.addListener(EVENTS.CHANGE_BLOCK_TYPE, this.showChangeRowType)
    listeners.changeRowIndent = eventEmitter.addListener(EVENTS.CHANGE_BLOCK_INDENT, this.changeRowIndent)
    listeners.reload = eventEmitter.addListener(EVENTS.RELOAD, this.reload)
    listeners.refresh = eventEmitter.addListener(EVENTS.REFRESH, this.refresh)
    // listeners.browseHistory = eventEmitter.addListener(EVENTS.BROWSE_HISTORY, this.browseHistory)
    
    
    listeners.logState = eventEmitter.addListener(EVENTS.LOG_STATE, () => {
      console.tron.display({
        name: 'STATE',
        value: { props: this.state },
      })
    })
    
    listeners.duplicateRow = eventEmitter.addListener(EVENTS.CONVERT_TO_RAW, () => {
      const data = convertToRaw({ rows: this.state.rows })
      console.tron.display({
        name: 'convertToRaw',
        value: { data },
      })
    })
    

    this.initialize()
  }


  // TODO: done
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


  // TODO: done
  initialize = () => {
    this.fillContentState()
  }

  // TODO: done
  fillContentState = () => {
    const { data = { blocks: [], entityMap: {} } } = this.props
    const rows = convertFromRaw({ contentState: data })
    this.setState({ rows, isReady: true })
  }
  
  // TODO: reload
  reload = () => {
    this.fillContentState()
  }
  
  // TODO: done
  refresh = () => {
    const { activeRowIndex } = this.state
    this.setState({ isReady: false }, () => {
      setTimeout(() => {
        this.setState({ isReady: true }, () => {
          setTimeout(() => {
            this.focusRow({ index: activeRowIndex })
          }, 100);
        })
      }, 100);
    })
  }
  
  // TODO: done
  clear = () => {
    this.setState({ rows: [] })
  }

  // TODO: Done
  hideKeyboard () {
    Keyboard.dismiss()
  }
  
  // TODO: Done
  toggleFullscreen = () => {
    const { isFullscreen } = this.state
    this.setState({ isFullscreen: !isFullscreen })
  }

  // TODO: Done
  toggleStyle = ({ style }) => {
    const { activeStyles = [], selection, activeRowIndex, rows } = this.state

    const activeRow = Object.assign({}, rows[activeRowIndex])
    style = style.toLowerCase()
    const isStyleActive = activeStyles.includes(style)
    const oldStyles = [...activeStyles]

    let newActiveStyles = []

    if (isStyleActive) {
      newActiveStyles = activeStyles.filter(i => i.toLowerCase() !== style)
    } else {
      newActiveStyles = [...activeStyles, style]
    }
    
    let newState = { activeStyles: newActiveStyles }
    
    let throwOnChange = false

    if(activeRowIndex !== null && selection.start < selection.end && selection.id === activeRow.id) {
      const data = attachStylesToSelectedText({ selection, row: activeRow, newStyles: newActiveStyles, oldStyles })
      activeRow.blocks = data.blocks
      const newRows = rows.concat([])
      newRows[activeRowIndex] = activeRow

      newState = {...newState, rows: newRows, extraData: Date.now() }
      throwOnChange = true
    }

    this.setState(newState, () => {
      this.emitActiveStyles()
      if(throwOnChange) {
        this.emitOnChange()
      }
    })
  }
  
  // TODO: Done
  deleteActiveRow = () => {
    const { activeRowIndex, rows } = this.state
    if(activeRowIndex !== null && rows.length > 0) {
      this.removeRow({ index: activeRowIndex, focusPrev: true })
    }
  }
  
  // TODO: done
  showChangeRowType = () => {
    const { activeRowIndex, rows =[] } = this.state

    if(activeRowIndex === null) {
      return
    }

    const activeRow = Object.assign({}, rows[activeRowIndex])

    var BUTTONS = {
      [ROW_TYPES.TEXT]:"Paragraph",
      [ROW_TYPES.HEADING1]:"Heading 1",
      [ROW_TYPES.HEADING2]:"Heading 2",
      [ROW_TYPES.HEADING3]:"Heading 3",
      [ROW_TYPES.BLOCKQUOTE]:"Blockquote",
      [ROW_TYPES.BULLETS]:"Bulleted List",
      [ROW_TYPES.NUMBERS]:"Numbered List",
      [ROW_TYPES.TODOS]:"TODO List",
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
      if (keys[i] === ROW_TYPES.NUMBERS) {
        this.changeRowType({ index: activeRowIndex, type: ROW_TYPES.NUMBERS })
      }
      if (keys[i] === ROW_TYPES.TODOS) {
        this.changeRowType({ index: activeRowIndex, type: ROW_TYPES.TODOS })
      }
    })
  }
  
  // TODO: done
  showInsertRow = () => {
    var BUTTONS = {
      [ROW_TYPES.TEXT]:"Paragraph",
      [ROW_TYPES.HEADING1]:"Heading 1",
      [ROW_TYPES.HEADING2]:"Heading 2",
      [ROW_TYPES.HEADING3]:"Heading 3",
      [ROW_TYPES.HR]:"Line Break",
      [ROW_TYPES.BLOCKQUOTE]: 'Blockquote',
      [ROW_TYPES.BULLETS]:"Bulleted List",
      [ROW_TYPES.NUMBERS]:"Numbered List",
      [ROW_TYPES.TODOS]:"TODO List",
      ["Sketch"]:"Sketch",
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
      if (keys[i] === ROW_TYPES.TEXT) {
        this.insertRow({ focus: true })
      }
      if (keys[i] === ROW_TYPES.HEADING1) {
        this.insertHeading({ heading: 'heading1' })
      }
      if (keys[i] === ROW_TYPES.HEADING2) {
        this.insertHeading({ heading: 'heading2' })
      }
      if (keys[i] === ROW_TYPES.HEADING3) {
        this.insertHeading({ heading: 'heading3' })
      }
      if (keys[i] === ROW_TYPES.HR) {
        this.insertRow({ type: ROW_TYPES.HR, focus: false, insertAfterActive: true })
      }
      if (keys[i] === ROW_TYPES.BLOCKQUOTE) {
        this.insertRow({ type: ROW_TYPES.BLOCKQUOTE, focus: true, insertAfterActive: true })
      }
      if (keys[i] === ROW_TYPES.BULLETS) {
        this.insertList({ list: 'bullets' })
      }
      if (keys[i] === ROW_TYPES.NUMBERS) {
        this.insertList({ list: 'numbers' })
      }
      if (keys[i] === ROW_TYPES.TODOS) {
        this.insertList({ list: 'todos' })
      }
      if (keys[i] === "Sketch") {
        this.showSketchModal()
      }
    })
  }

  // FIXME: done
  showUploadFile = () => {
    var BUTTONS = {
      ["Take Photo"]:"Take Photo",
      ["Browse Photo"]:"Browse Photo",
      cancel: 'Cancel'
    };
    var CANCEL_INDEX = Object.values(BUTTONS).length-1;
    var DESTRUCTIVE_INDEX = -1

    ActionSheet.show({
      options: Object.values(BUTTONS),
      cancelButtonIndex: CANCEL_INDEX,
      destructiveButtonIndex: DESTRUCTIVE_INDEX,
      title: "Insert Image"
    }, i => {
      const keys = Object.keys(BUTTONS)
      if (keys[i] === "Take Photo") {
        this.insertImage({ type: "Take Photo" })
      }
      if (keys[i] === "Browse Photo") {
        this.insertImage({ type: "Browse Photo" })
      }
    })
  }

  // FIXME: Done
  insertImage = async ({ type }) => {
    const { statusCamera } = await Permissions.askAsync(Permissions.CAMERA);
    if(statusCamera === 'granted') {
      alert('CAMERA Permission Error')
      return
    }
    
    const { statusLibrary } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if(statusLibrary === 'granted') {
      alert('CAMERA_ROLL Permission Error')
      return
    }

    const pickerTypes = {
     ['Take Photo'] : 'launchCameraAsync',
     ['Browse Photo'] : 'launchImageLibraryAsync',
    }

    let result = await ImagePicker[pickerTypes[type]]({
      allowsEditing: true,
      aspect: [4, 3],
    });

    console.log(result);

    if (!result.cancelled) {
      let newRowData = { id: generateId(), type: ROW_TYPES.IMAGE, image: result.uri }
      this.insertRow({ newRowData, insertAfterActive: true, focus: true })
    }
  }

  // TODO: Done
  duplicateRow = () => {
    const { activeRowIndex, rows = [] } = this.state

    if(activeRowIndex === null) { return }

    const activeRow = Object.assign({}, rows[activeRowIndex])
    const newRowData = {...activeRow, id: generateId()}

    this.insertRow({ newRowData, insertAfterActive: true, focus: true })
  }

  // TODO: Done
  emitActiveStyles = ({ activeStyles, updateState = false } = {}) => {
    let newActiveStyles = activeStyles || this.state.activeStyles
    newActiveStyles = _.uniq(newActiveStyles)
    getEmitter().emit(EVENTS.ACTIVE_STYLE_CHANGED, { activeStyles: newActiveStyles })
    if(updateState) {
      this.setState({ activeStyles })
    }
  }
  
  // TODO: Done
  changeRowIndex = ({ direction }) => {
    const { activeRowIndex, rows = [] } = this.state
    
    if(activeRowIndex === null) { return }

    const newRows = [...rows]
    const currentBlock = Object.assign({}, rows[activeRowIndex])
    let shouldSwapIndex = false
    let newIndex

    if(direction === 'up') {
      newIndex = activeRowIndex-1
      const prevRow = Object.assign({}, rows[newIndex])
      if(prevRow && newIndex > -1) {
        newRows[newIndex] = currentBlock
        newRows[activeRowIndex] = prevRow
        shouldSwapIndex = true
      }
    }
    
    if(direction === 'down') {
      newIndex = activeRowIndex+1
      const nextRow = Object.assign({}, rows[newIndex])
      if(nextRow) {
        newRows[newIndex] = currentBlock
        newRows[activeRowIndex] = nextRow
        shouldSwapIndex = true
      }
    }

    if(shouldSwapIndex) {
      this.focusRow({ index: newIndex })
      this.setState({ rows: newRows, activeRowIndex: newIndex, extraData: Date.now() }, () => {
        this.emitOnChange()
        setTimeout(() => {
          this.focusRow({ index: newIndex })
        }, 50);
      })
    }
  }
  
  // TODO: done
  changeRowIndent = ({ direction }) => {
    const { activeRowIndex, rows = [] } = this.state
    if(activeRowIndex === null) {
      return
    }

    const indent = "       "

    const newRows = [...rows]
    const currentRow = Object.assign({}, rows[activeRowIndex])
    const text = currentRow.value || ''

    if(direction === 'increase') {
      currentRow.value = `${indent}${text}`
      currentRow.blocks.unshift({ text: indent })
      newRows[activeRowIndex] = currentRow
      this.setState({ rows: newRows, extraData: Date.now() })
    }
    
    if(direction === 'decrease') {
      if(text.startsWith(indent)) {
        currentRow.value = text.slice(indent.length-1, text.length);
        currentRow.blocks.shift()
        newRows[activeRowIndex] = currentRow
        this.setState({ rows: newRows, extraData: Date.now() })
      }
    }
  }

  // TODO: done
  splitRow = ({ row, index }) => {
    const { rows = [], selection } = this.state
    const newSplittedRows = splitRow({ row, selection }) || []

    let newActiveRowIndex = index+1
    
    const newRows = [...rows]
    newRows[index] = newSplittedRows[0]
    newRows.splice(newActiveRowIndex, 0,newSplittedRows[1])
    let newSelection = {...selection, id: newSplittedRows[1].id }
    this.setState({ rows: newRows, activeRowIndex: newActiveRowIndex, selection: newSelection, extraData: Date.now() }, () => {
      this.focusRow({ index: newActiveRowIndex })
    })
  }

  // FIXME:
  showSketchModal = () => {
    this.setState({ isSketchVisible: true })
  }

  /**
   * TODO: re-write
   * beginning press enter: insert new block before (keep type if is list)
   * middle press enter: split row at cursor
   * end press enter: insert new block after (keep type if is list)
   */
  onSubmitEditing = ({ row, index }) => () => {
    const { rows = [], selection } = this.state

    const currentRow = Object.assign({}, rows[index])
    const nextRow = Object.assign({}, rows[index+1])

    if (selection.start === 0 && selection.end === 0 && currentRow.value) {
      this.insertRow({ focus: false, currentRow, insertBeforeActive: true, focusIndex: index+1 })
    } else if(currentRow.value
        && selection.start === selection.end
        && selection.start > 0
        && selection.end < currentRow.value.length
    ) { // Split this line
      this.splitRow({ row, index })
    } else if(!currentRow.value && isListRow(currentRow.type)) { // Switch this line to text row
      this.changeRowType({ index, type: ROW_TYPES.TEXT })
    } else if (nextRow.id && isListRow(currentRow.type)) {      
      this.insertRow({ focus: true, currentRow, insertAfterActive: true })
    } else if (nextRow.id){
      this.insertRow({ focus: true, insertAfterActive: true })
    } else {
      this.insertRow({ focus: true, insertAfterActive: true, currentRow })
    }
  }
  
  // TODO: done
  onChangeText = ({ index }) => nv => {
    const { rows = [] } = this.state
    let newRows = [...rows]
    newRows[index].value = (nv || '')
    this.setState({ blocks: newRows })
  }

  // FIXME: re-write
  handleBackspace = ({ row: item, index }) => {
    const { selection, rows = [] } = this.state
    let row = Object.assign({}, item)
    const prevRow = Object.assign({}, rows[index-1])
    const { value = '', blocks = [] } = row

    if (selection.start < selection.end) {
      const newBlocks = removeSelectedText({ selection, row }) 
      row.blocks = newBlocks
    } else if (selection.start === selection.end && selection.start === 0 && prevRow && prevRow.type === ROW_TYPES.HR) {
      this.removeRow({ index: index-1 }, () => {
        this.focusRow({ index: index-1 })
      })
    } else if(!value.length) {
      this.removeRow({ index, focusPrev: true })
    } else if(value.length === 1) {
      this.removeRow({ index, focusPrev: true })
    } else if(selection.start === 0) {
      
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

  // FIXME: re-write
  handleKeyPress = ({ row: item, index }) => ({ nativeEvent: { key: keyValue }, ...rest }) => {
    const { rows = [], selection, activeStyles } = this.state
    let row = item // Object.assign({}, item)
    const currentRow = rows[index] // Object.assign({}, rows[index])
    let blocks = currentRow.blocks // [...currentRow.blocks]

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
        const newRowBlocks = removeSelectedText({ selection, row }) || []
        row.blocks = newRowBlocks
        blocks = [].concat(newRowBlocks)
      }

      const currentBlock = getCurrentBlockInRow({ selection, row })

      const { 
        block: {
          text: blockText = '', 
          styles: blockStyles = []
        } = {},
        pointerAt,
        blockIndex
      } =  currentBlock || {}

      console.tron.display({
        name: 'currentBlock',
        value: { props: currentBlock },
      })
      
      let newBlocks = blocks // [].concat(blocks)
      
      const isStylesChanged = !_.isEqual(activeStyles, blockStyles)

      if (isStylesChanged) {

        let p1 = blocks.slice(0, blockIndex)
        let p2 = blocks.slice(blockIndex+1)

        console.tron.display({
          name: 'p1, p2',
          value: { p1, p2 },
        })
        
        const newCharBlocks = []

        const blockBeforeText = blockText.substring(0, pointerAt)
        const blockAfterText = blockText.substring(pointerAt, blockText.length)
                
        const newBlock = { text: keyValue, styles: [].concat(activeStyles) }

        if(blockBeforeText) {
          newCharBlocks.push({ text: blockBeforeText, styles: [...blockStyles] })
        }
        
        newCharBlocks.push(newBlock)

        if(blockAfterText) {
          newCharBlocks.push({ text: blockAfterText, styles: [...blockStyles] })
        }
        
        newBlocks = [...p1, ...newCharBlocks, ...p2]

        console.tron.display({
          name: 'newCharBlocks',
          value: { newCharBlocks, p1, p2,  },
        })

      } else {
        const newBlockText = insertAt(blockText, keyValue, currentBlock.pointerAt)
        if (!newBlocks[currentBlock.blockIndex]) {
          newBlocks[currentBlock.blockIndex] = {}
        }
        newBlocks[currentBlock.blockIndex].text = newBlockText
      }

      // let newRows = [].concat(rows)
      let newRows = [...rows]
      newRows[index].blocks = newBlocks
      rows[index].blocks = newBlocks

      let newState = {rows: newRows, extraData: Date.now() }

      this.setState(newState)
    }

    this.emitOnChange()
  }

  // FIXME: re-write
  onSelectionChange = ({ row, index }) => (event) => {
    const { selection } = event.nativeEvent
    const { rows = [], activeRowIndex, selection: oldSelection } = this.state
    const activeRow = Object.assign({}, rows[activeRowIndex])

    if(row.id !== activeRow.id) {
      return
    }
    
    if(oldSelection.id === row.id
      && oldSelection.start === selection.start
      && oldSelection.end === selection.end
    ) {
      return
    }
    
    let newSelection = { ...selection, id: row.id }

    this.setState({ selection: newSelection }, () => {
      
      console.log("onSelectionChange::", selection.start, selection.end, activeRowIndex)
      
      setTimeout(() => {
        if (newSelection.start === newSelection.end && activeRowIndex !== null) {
            const { block: { styles: blockStyles = [] } = {}, position } = getCurrentBlockInRow({ selection: newSelection, row })
            let activeStyles = blockStyles
    
            if(position === 'end') {
              const lastBlockIndex = row.blocks.length-1
              lastBlock = row.blocks[lastBlockIndex] || { styles: [] }
              console.tron.display({
                name: 'lastBlock',
                value: { props: lastBlock, row },
              })
              activeStyles = blockStyles.concat(lastBlock.styles || [])
              activeStyles = _.uniq(activeStyles)
            }
    
            this.emitActiveStyles({ activeStyles, updateState: true })

        } else if (newSelection.start < newSelection.end) {
          const { startBlock, endBlock } = getSelectedBlocks({ selection: newSelection, row })
          const { blocks } = row
    
          const blockStyles = []
    
          for (let i = startBlock.blockIndex; i <= endBlock.blockIndex; i++) {
            const block = blocks[i] || {};
            const { styles = [], text = '' } = block 
            if(text && text !== ' ') {
              blockStyles.push(styles)
            }
          }
    
          const commonStyles = _.intersection(...blockStyles);
          this.emitActiveStyles({ activeStyles: commonStyles, updateState: true })
        }
      });

    })

  }

  // FIXME: half
  onFocus = ({ row, index }) => (e) => {
    const { rows = [], activeRowIndex } = this.state
    const activeRow = Object.assign({}, rows[index])

    if (activeRowIndex !== index) {
      this.setState({ activeRowIndex: index }, () => {
        if(activeRow.value) {
          const newSelection = { start: activeRow.value.length, end: activeRow.value.length, id: activeRow.id }
          const event = { nativeEvent: { selection: newSelection } }
          this.onSelectionChange({ row: activeRow, index })(event) 
        } else {
          const newSelection = { start: 0, end: 0, id: activeRow.id }
          const event = { nativeEvent: { selection: newSelection } }
          this.onSelectionChange({ row: activeRow, index })(event) 
        }
        this.checkActiveRowTypeChanged()
      })
    } else {
      this.checkActiveRowTypeChanged()
    }

    const { onFocus } = this.props
    if(onFocus) {
      onFocus({ index, contentState: this.getContentState() })
    }
  }

  // TODO: half
  getContentState = () => {
    return convertToRaw({ rows: this.state.rows })
  }

  // TODO: done
  checkActiveRowTypeChanged = () => {
    const { activeRowIndex, rows = [] } = this.state
    const activeRow = rows[activeRowIndex] || {}
    const { type = '' } = activeRow
    getEmitter().emit(EVENTS.ROW_TYPE_CHANGED, { type })
  }

  // TODO: needs check
  focusRow ({ index, timeout = 0, clearStyles = true }, callback = () => {}) {
    const { rows = [], activeStyles = [], activeRowIndex } = this.state
    const input = this.textInputRefs[index]
    if(input) {
      const row = Object.assign({}, rows[index])
      let newStyles = [...activeStyles]
      if(!row.value || clearStyles) {
        newStyles = []
      }

      let newState = { activeStyles: newStyles }

      if(activeRowIndex !== index) {
        newState.activeRowIndex = index
      }
      
      this.setState(newState, () => {
        setTimeout(() => {
          input.focus()
          callback()
        }, timeout);
      })
    }
  }

  // FIXME: needs attention
  insertRow ({
    type = ROW_TYPES.TEXT,
    focus = false,
    focusIndex = null,
    newRowData,
    currentRow,
    insertAtActive = false,
    insertAfterActive = false,
    insertBeforeActive = false,
    insertAtLast = false,
    updateActiveIndex = false,
  } = {}, callback = () => {}) {
    const { rows = [], activeRowIndex } = this.state

    let newRows = [...rows]

    let newRowType = type

    if(currentRow) {
      if(currentRow.type === ROW_TYPES.BULLETS) {
        newRowType = ROW_TYPES.BULLETS
      }
      if(currentRow.type === ROW_TYPES.NUMBERS) {
        newRowType = ROW_TYPES.NUMBERS
      }
      if(currentRow.type === ROW_TYPES.TODOS) {
        newRowType = ROW_TYPES.TODOS
      }
    }
    
    let newRow = newRowData || { id: generateId(), type: newRowType, blocks: [], extraData: Date.now() }
    newRow = Object.assign({}, newRow)

    let newRowIndex

    if(activeRowIndex !== null && insertAtActive) {
      newRows.splice(activeRowIndex, 0, newRow);
      newRowIndex = activeRowIndex
    } else if(activeRowIndex !== null && insertAfterActive) {
      newRows.splice(activeRowIndex+1, 0, newRow);
      newRowIndex = activeRowIndex+1
    } else if(activeRowIndex !== null && insertBeforeActive) {
      newRows.splice(activeRowIndex, 0, newRow);
      newRowIndex = activeRowIndex
    } else if(insertAtLast) {
      newRows.push(newRow)
      newRowIndex = rows.length - 1
    } else {
      newRows.push(newRow)
      newRowIndex = rows.length - 1
    }

    const newState = {
      rows: newRows,
      extraData: Date.now(),
      activeStyles: [],
      selection: { start: 0, end: 0, id: newRow.id }
    }

    if(updateActiveIndex && !focus) {
      newState.activeRowIndex = newRowIndex
    }

    if(focusIndex !== null) {
      newState.activeRowIndex = focusIndex
    }

    this.setState(newState, () => {
      this.emitActiveStyles()
      this.emitOnChange()
      callback({ newRowIndex, newRow })
      setTimeout(() => {
        if(focus) {
          this.focusRow({ index: newRowIndex, isNew: true })
        } if(focusIndex !== null) {
          this.focusRow({ index: focusIndex })
        }
      });
    })
  }

  // TODO: done
  insertHeading = ({ heading }) => {
    const key = heading.toUpperCase()
    this.insertRow({ type: ROW_TYPES[key], focus: true, insertAfterActive: true })
  }
  
  // TODO: done
  insertList = ({ list }) => {
    const key = list.toUpperCase()
    this.insertRow({ type: ROW_TYPES[key], focus: true, insertAfterActive: true })
  }

  // TODO: done
  removeRow ({ index, focusPrev = false }, callback = () => {}) {
    const { rows = [] } = this.state
    if(rows.length > 0) {
      let newRows = [...rows]
      newRows.splice(index, 1)
      this.setState({ rows: newRows, activeRowIndex: index-1, extraData: Date.now() }, () => {
        this.emitOnChange()
        setTimeout(() => {
          if(focusPrev) {
            this.focusRow({ index: index-1 })
          }
          callback()
        });
      })
    }
  }

  // TODO: done
  emitOnChange = () => {
    const { onChange } = this.props
    if(onChange) {
      onChange(this.getContentState())
    }
  }

  // TODO: done
  changeRowType ({ index, type }) {
    const { rows = [] } = this.state
    const row = Object.assign({}, rows[index])
    if(row) {
      row.type = type
      // If its heading row, remove styles
      if(type.includes('heading')) {
        row.blocks = row.blocks.map(item => ({ text: item.text }))
      }
      const newRows = [...rows]
      newRows[index] = row
      this.setState({ rows: newRows, extraData: Date.now() }, () => {
        this.emitOnChange()
        this.checkActiveRowTypeChanged()
        this.focusRow({ index, timeout: 100 })
      })
    }
  }

  // FIXME: 
  handleImage = ({ row, index }) => () => {
    const { activeRowIndex, rows = [] } = this.state
    ActionSheet.show({
      options: ['Delete', 'Cancel'],
      cancelButtonIndex: 1,
      destructiveButtonIndex: 0,
      title: "Delete Image"
    }, i => {
      if (i === 0) {
        // this.changeRowType({ index: activeRowIndex, type: ROW_TYPES.TEXT })
        this.removeRow({ index, focusPrev: true })
      }
    })
  }

  // FIXME: 
  toggleTodo = ({ row, index }) => () => {
    const { rows = [] } = this.state
    const isCompleted = !row.isCompleted
    const newRows = [...rows]
    newRows[index].isCompleted = isCompleted
    this.setState({ rows: newRows })
  }


  // FIXME: 
  onSketchSave = (image) => {
    if(!image) {
      this.setState({ isSketchVisible: false })
      return
    }

    let newRowData = { id: generateId(), type: ROW_TYPES.IMAGE, image }
    this.insertRow({ newRowData, insertAfterActive: true, focus: true }, () => {
      this.setState({ isSketchVisible: false })
    })
  };


  // FIXME: re-think
  getPlaceholder = ({ row, index }) => {
    const { rows } = this.state
    if(index === 0 && rows.length === 1) {
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
  
  // TODO: half
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
  
  // TODO: half
  getNumberOrder = ({ index }) => {
    const { rows } = this.state
    let numberOrder = 0
    for (let i = index; i >= 0; i--) {
      const block = rows[i];
      if(block.type !== ROW_TYPES.NUMBERS) {
        break
      }
      numberOrder+=1
    }
    return numberOrder
  }
  
  // FIXME: needs attention
  renderInput = ({ row, index }) => {
    const { selection } = this.state

    const placeholder = this.getPlaceholder({ row, index })
    const inputStyles = this.getInputStyles({ row, index })

    const isBullet = row.type === ROW_TYPES.BULLETS
    const isNumbers = row.type === ROW_TYPES.NUMBERS
    const isTodo = row.type === ROW_TYPES.TODOS
    const numberOrder = this.getNumberOrder({row, index})

    const { blocks = [] } = row

    return (
      <View style={styles.row}>
        {isBullet && <Text style={styles.bullet}>•</Text>}
        {isNumbers && <Text style={styles.numberOrder}>{numberOrder}.</Text>}
        {isTodo && <CheckBox style={styles.checkbox} isChecked={row.isCompleted} toggle={this.toggleTodo({ row, index })} />}
        <TextInput
          underlineColorAndroid="transparent"
          ref={(input) => { this.textInputRefs[index] = input; }}
          placeholder={placeholder}
          onSubmitEditing={this.onSubmitEditing({ row, index })}
          onFocus={this.onFocus({ row, index })}
          onChangeText={this.onChangeText({ item: row, index })}
          onKeyPress={this.handleKeyPress({ row, index })}
          onSelectionChange={this.onSelectionChange({ row, index })}
          style={[styles.textInput, inputStyles]}
          clearButtonMode="never"
          blurOnSubmit={true}
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
      </View>
    )
  }

  // FIXME: needs attention
  renderItem = ({ item: row, index }) => {
    if(row.type === ROW_TYPES.HR) {
      return this.renderLineBreak({ row, index })
    }
    
    if(row.type === ROW_TYPES.IMAGE) {
      return this.renderImage({ row, index })
    }

    return this.renderInput({ row, index })
  }

  // FIXME: 
  renderImage = ({ row, index }) => {
    return (
      <View style={styles.row}>
        <TouchableOpacity style={styles.imageRow} onLongPress={this.handleImage({ row, index })}>
          <Lightbox>
            <Image source={{ uri: row.image }} resizeMode="contain" style={styles.image} />
          </Lightbox>
        </TouchableOpacity>
      </View>
    )
  }

  // FIXME: 
  renderLineBreak = ({ row, index }) => {
    return (
      <View style={styles.row}>
        <View style={styles.hr}/>
      </View>
    )
  }

  // FIXME: half - bug when last row is list
  renderFooter = () => {
    const { rows = []} = this.state
    const lastRowIndex = rows.length-1
    let lastRow = rows[lastRowIndex]
      ? Object.assign({}, rows[lastRowIndex])
      : null
    return (
      <View style={styles.row}>
        <TextInput
          underlineColorAndroid="transparent"
          blurOnSubmit={false}
          style={[styles.textInput]}
          clearButtonMode="never"
          autoCorrect={false}
          onFocus={() => {
            this.insertRow({ focusIndex: lastRowIndex+1, currentRow: lastRow })
          }}
          autoCapitalize="none"
          returnKeyType="default"
          multiline={false}
          placeholder="Footer"
        >
        </TextInput>
      </View>
    )
  }

  // FIXME: half - focus
  renderEmpty = () => {
    return (
      <View style={styles.row}>
        <TextInput
          underlineColorAndroid="transparent"
          blurOnSubmit={false}
          style={[styles.textInput]}
          clearButtonMode="never"
          autoCorrect={false}
          onFocus={() => {
            this.insertRow({ focusIndex: 0 })
          }}
          autoCapitalize="none"
          returnKeyType="default"
          multiline={false}
          placeholder="Empty"
        >
        </TextInput>
      </View>
    )
  }

  // TODO: done
  renderLoading = () => {
    return (
      <View>
        <ActivityIndicator size="small" />
      </View>
    )
  }

  // FIXME: empty
  renderHeader = () => {
    return (
      <View />
    )
  }

  // FIXME: half
  renderList() {
    const { rows, extraData, isReady } = this.state

    if(!isReady) {
      return this.renderLoading()
    }

    return (
      <FlatList
        data={rows.concat([])}
        keyExtractor={i => i.id}
        extraData={extraData}
        keyboardShouldPersistTaps={"always"}
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.contentContainerStyle}
        renderItem={this.renderItem}
        ListFooterComponent={this.renderFooter}
        ListEmptyComponent={this.renderEmpty}
        ListHeaderComponent={this.renderHeader}
        style={styles.flatList}
      />
    );
  }
  
  renderFullScreen() {
    const { isFullscreen } = this.state
    return (
      <Modal
        visible={isFullscreen}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {}}
      >
        <Container>
          <Header>
            <Body>
              <Title>Edit Text</Title>
            </Body>
          </Header>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
              <KeyboardAwareView keyboardShouldPersistTaps animated>
                <View style={styles.editor}>
                  {this.renderList()}
                </View>
                <TextToolbar />
              </KeyboardAwareView>
            </View>
          </SafeAreaView>
        </Container>
      </Modal>
    );
  }
  
  renderSketchModal() {
    const { isSketchVisible } = this.state
    return (
      <Sketch
        isSketchVisible={isSketchVisible}
        onCancel={() => {this.setState({ isSketchVisible: false })}}
        onSave={this.onSketchSave}
      />
    );
  }
  
  render() {
    const { isFullscreen, isSketchVisible, isReady } = this.state

    if(!isReady) {
      return this.renderLoading()
    }

    return (
      <React.Fragment>
        {isFullscreen ? this.renderFullScreen() : this.renderList()}
        {this.renderSketchModal()}
      </React.Fragment>
    )
  }
}

export default Editor