import shortid from "shortid";

export const generateId = () => shortid()

const data = {"blocks":[{"key":"1la1e","text":"thi wil contain bold","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":16,"length":4,"style":"BOLD"}],"entityRanges":[],"data":{}},{"key":"5bl2j","text":"thi wil contain italic","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":16,"length":6,"style":"ITALIC"}],"entityRanges":[],"data":{}},{"key":"9sen6","text":"thi wil contain underline","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":16,"length":9,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"a11h3","text":"thi wil contain bold italic","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":16,"length":4,"style":"BOLD"},{"offset":21,"length":6,"style":"BOLD"},{"offset":21,"length":6,"style":"ITALIC"}],"entityRanges":[],"data":{}},{"key":"3g7tj","text":"thi wil contain bold underline","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":16,"length":4,"style":"BOLD"},{"offset":21,"length":9,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"o4sp","text":"thi wil contain italic underline","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":16,"length":6,"style":"BOLD"},{"offset":23,"length":9,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"dtmbt","text":"thi wil contain bold italic underline","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":16,"length":4,"style":"BOLD"},{"offset":21,"length":6,"style":"ITALIC"},{"offset":28,"length":9,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"596kp","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"8jtu1","text":"combine bolditalic","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":8,"length":10,"style":"BOLD"},{"offset":12,"length":6,"style":"ITALIC"}],"entityRanges":[],"data":{}},{"key":"86phc","text":"combine boldunderline","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":8,"length":13,"style":"BOLD"},{"offset":12,"length":9,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"69jv4","text":"combine italicunderline","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":8,"length":6,"style":"ITALIC"},{"offset":14,"length":9,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"kpe8","text":"combine bolditalicunderline","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":8,"length":4,"style":"BOLD"},{"offset":12,"length":6,"style":"ITALIC"},{"offset":18,"length":9,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"292du","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"6g2mu","text":"test ","type":"unordered-list-item","depth":0,"inlineStyleRanges":[{"offset":0,"length":5,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"a2fp3","text":"asdasdasda s","type":"unordered-list-item","depth":0,"inlineStyleRanges":[{"offset":0,"length":12,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"4u38f","text":"asd asd","type":"unordered-list-item","depth":0,"inlineStyleRanges":[{"offset":0,"length":7,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"28gr5","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"2tjri","text":"test ","type":"ordered-list-item","depth":0,"inlineStyleRanges":[{"offset":0,"length":5,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"8oduf","text":"asda sd","type":"ordered-list-item","depth":0,"inlineStyleRanges":[{"offset":0,"length":7,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"dtld2","text":"asdasdd ","type":"ordered-list-item","depth":0,"inlineStyleRanges":[{"offset":0,"length":8,"style":"UNDERLINE"}],"entityRanges":[],"data":{}},{"key":"dhfar","text":"asd dasd asd","type":"ordered-list-item","depth":0,"inlineStyleRanges":[{"offset":0,"length":12,"style":"UNDERLINE"},{"offset":4,"length":4,"style":"ITALIC"},{"offset":10,"length":2,"style":"BOLD"}],"entityRanges":[],"data":{}}],"entityMap":{}}

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

const getBlockType = type => {
  if (type === 'unordered-list-item') {
    return BLOCK_TYPES.BULLETS
  }
  
  if (type === 'ordered-list-item') {
    return BLOCK_TYPES.NUMBERS
  }
  
  return BLOCK_TYPES.TEXT
}

const parseRow = block => {
  const {text, inlineStyleRanges, type} = block

  if(!text || !text.length) {
    return { row: [ { text: '' } ], type: getBlockType(type), text: '' }
  }
  const result = []

  let styleOffsets = []

  inlineStyleRanges.forEach(inlineStyleRange => {
    styleOffsets.push(inlineStyleRange['offset'])
    styleOffsets.push(inlineStyleRange['length'] + inlineStyleRange['offset'])
  })

  styleOffsets = styleOffsets.filter((item, pos) => {
    return styleOffsets.indexOf(item) == pos; 
  });
  

  styleOffsets.sort((a, b) => a - b)

  const firstIndex = styleOffsets[0]
  if(firstIndex > 0) {
    const item = {
      text: text.substring(0, firstIndex),
    }
    result.push(item)
  }

  styleOffsets.forEach((a, index) => {
    const b = styleOffsets[index+1]
    if(b) {
      const item = {
        // text: text.substring(a, b),
        styles: []
      }

      inlineStyleRanges.forEach(inlineStyleRange => {
        const start = inlineStyleRange['offset']
        const end = inlineStyleRange['length'] + inlineStyleRange['offset']

        if(start >= a && b <= end ) {
          item.text = text.substring(a, b)
          item.range = [a, b]
          if(inlineStyleRange.style) {
            item.styles.push(inlineStyleRange.style)
          }
        }
      })

      result.push(item)
    }
  })

  const lastIndex = styleOffsets[styleOffsets.length-1]
  if(lastIndex < text.length) {
    const item = {
      text: text.substring(lastIndex, text.length),
    }
    result.push(item)
  }

  return { row: result, text, type: getBlockType(type) }
}

export const convertFromRaw = () => {
  const { blocks } = data

  const result = []

  blocks.forEach(block => {
    const { row, text, type } = parseRow(block)
    result.push({ id: generateId(), type, value: text, blocks: row })
  })


  // console.log(result)

  return result
}

export const convertToRaw = (data) => {
  const result = { blocks: [], entityMap: {} }

  const sample = {
    key: '1la1e',
    text: '',
    type: 'unstyled',
    depth: 0,
    inlineStyleRanges: [],
    entityRanges: [],
    data: {},
  }

  data.forEach(item => {
    // console.log(item)
    // const { row, text, type } = parseRow(item)
    // result.push({ id: generateId(), type, value: text, blocks: row })

    const row = {
      ...sample,
      key: generateId(),
      text: item.value,
    }

    result.blocks.push(row)
  })

  // console.log(JSON.stringify(result))

  return result
}