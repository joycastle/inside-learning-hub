const unescapeMarkdownPunctuation = (value: string) => value.replace(/\\([.\\&-])/g, '$1')

const tidyInlineMarks = (value: string) => value
  .replace(/\*{4,}/g, '**')
  .replace(/\*+/g, '')
  .replace(/_{2,}/g, '')
  .replace(/\s+/g, ' ')
  .trim()

const spaceAfterNumbering = (value: string) => value
  .replace(/^(\d+(?:\.\d+)+)(?=\S)/, '$1 ')
  .replace(/^(\d+)[.)](?=[^\d\s])/, '$1. ')

const normalizeHeadingLine = (hashes: string, title: string) => {
  const cleaned = spaceAfterNumbering(tidyInlineMarks(unescapeMarkdownPunctuation(title)))
  return `${hashes} ${cleaned}`
}

const normalizeProseLine = (line: string) => {
  const heading = line.match(/^(\s{0,3}#{1,6})\s+(.*)$/)
  if (heading) return normalizeHeadingLine(heading[1], heading[2])

  const numberedTitle = line.match(/^\s*\*{2,}\s*(\d+)\s*\\?[.)]\s*\*{0,}\s*(.+?)\s*$/)
  if (numberedTitle) return `### ${numberedTitle[1]}. ${tidyInlineMarks(unescapeMarkdownPunctuation(numberedTitle[2]))}`

  const callout = line.match(/^\s*\*{0,2}【(.+?)】\*{0,2}\s*$/)
  if (callout) return `> ${tidyInlineMarks(unescapeMarkdownPunctuation(callout[1]))}`

  return unescapeMarkdownPunctuation(line).replace(/\*{4,}/g, '**')
}

const normalizeProse = (value: string) => value
  .replace(/\r\n/g, '\n')
  .split('\n')
  .map(normalizeProseLine)
  .join('\n')

export const normalizeMarkdown = (value: string) => value
  .split(/(```[\s\S]*?```)/)
  .map((part, index) => (index % 2 === 1 ? part : normalizeProse(part)))
  .join('')
