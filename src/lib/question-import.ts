import type { QuizQuestion } from '@/lib/types'

const optionIds = ['a', 'b', 'c', 'd']

export const parseCsvRows = (text: string) => {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      row.push(field.trim())
      field = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

const answerIds = (answer: string) => {
  const letters = answer.toUpperCase().match(/[A-D]/g) ?? []
  return [...new Set(letters.map((letter) => letter.toLowerCase()))]
}

const buildQuestion = (input: {
  prompt: string
  options: string[]
  answer: string
  explanation?: string
  type?: string
}): QuizQuestion | null => {
  const options = input.options.map((label, index) => ({ id: optionIds[index], label: label.trim() })).filter((item) => item.label)
  const correctOptionIds = answerIds(input.answer).filter((id) => options.some((option) => option.id === id))
  if (!input.prompt.trim() || options.length < 2 || correctOptionIds.length === 0) return null
  return {
    id: `question-${crypto.randomUUID()}`,
    courseId: 'course-onboarding',
    categoryId: 'imported-choice',
    type: input.type?.includes('多') || correctOptionIds.length > 1 ? 'multiple' : 'single',
    prompt: input.prompt.trim(),
    options,
    correctOptionIds,
    explanation: input.explanation?.trim() ?? '',
    difficulty: 'medium',
  }
}

const parseCsvQuestions = (text: string) => {
  const [headers = [], ...rows] = parseCsvRows(text)
  const normalizedHeaders = headers.map((header) => header.trim().toLowerCase())
  const find = (...names: string[]) => normalizedHeaders.findIndex((header) => names.includes(header))
  const promptIndex = find('题目', 'question', 'prompt')
  const answerIndex = find('正确答案', '答案', 'answer')
  if (promptIndex < 0 || answerIndex < 0) return []
  const optionIndexes = ['a', 'b', 'c', 'd'].map((letter) => find(`选项${letter}`, `option${letter}`, letter))
  const explanationIndex = find('解析', 'explanation')
  const typeIndex = find('题型', 'type')
  return rows.flatMap((row) => {
    const question = buildQuestion({
      prompt: row[promptIndex] ?? '',
      options: optionIndexes.map((index) => index >= 0 ? row[index] ?? '' : ''),
      answer: row[answerIndex] ?? '',
      explanation: explanationIndex >= 0 ? row[explanationIndex] : '',
      type: typeIndex >= 0 ? row[typeIndex] : '',
    })
    return question ? [question] : []
  })
}

const parseWordQuestions = (text: string) => text
  .replaceAll('\r', '')
  .split(/(?=题目\s*[:：])/)
  .flatMap((block) => {
    const prompt = block.match(/题目\s*[:：]\s*([^\n]+)/)?.[1] ?? ''
    const options = [...block.matchAll(/^\s*([A-Da-d])[.、．:：]\s*(.+)$/gm)]
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map((match) => match[2])
    const answer = block.match(/(?:正确)?答案\s*[:：]\s*([^\n]+)/)?.[1] ?? ''
    const explanation = block.match(/解析\s*[:：]\s*([^\n]+)/)?.[1] ?? ''
    const question = buildQuestion({ prompt, options, answer, explanation })
    return question ? [question] : []
  })

export const importQuestionsFromText = (text: string) => {
  const firstLine = text.replaceAll('\r', '').split('\n')[0] ?? ''
  return firstLine.includes(',') ? parseCsvQuestions(text) : parseWordQuestions(text)
}

export const extractDocxText = async (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  let endOfCentralDirectory = -1
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) {
      endOfCentralDirectory = index
      break
    }
  }
  if (endOfCentralDirectory < 0) throw new Error('无法识别该 Word 文件')

  const centralDirectoryOffset = view.getUint32(endOfCentralDirectory + 16, true)
  const entries = view.getUint16(endOfCentralDirectory + 10, true)
  const decoder = new TextDecoder()
  let offset = centralDirectoryOffset

  for (let entry = 0; entry < entries; entry += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break
    const compression = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const fileNameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localHeaderOffset = view.getUint32(offset + 42, true)
    const fileName = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength))

    if (fileName === 'word/document.xml') {
      const localFileNameLength = view.getUint16(localHeaderOffset + 26, true)
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true)
      const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraLength
      const compressed = bytes.slice(dataOffset, dataOffset + compressedSize)
      const compressedStream = new Response(compressed).body
      if (!compressedStream) throw new Error('无法读取 Word 压缩内容')
      const xmlBytes = compression === 0 ? compressed : new Uint8Array(await new Response(
        compressedStream.pipeThrough(new DecompressionStream('deflate-raw')),
      ).arrayBuffer())
      const xml = decoder.decode(xmlBytes)
      const document = new DOMParser().parseFromString(xml, 'application/xml')
      return Array.from(document.getElementsByTagName('w:p')).map((paragraph) => paragraph.textContent?.trim() ?? '').filter(Boolean).join('\n')
    }
    offset += 46 + fileNameLength + extraLength + commentLength
  }

  throw new Error('Word 文件中没有找到正文内容')
}
