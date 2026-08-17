import { describe, expect, it } from 'vitest'
import { extractDocxText, importQuestionsFromText, parseCsvRows } from '@/lib/question-import'

const docxFixture = 'UEsDBAoAAAAAABqDDl0AAAAAAAAAAAAAAAAFABwAd29yZC9VVAkAA9PQfmrd0H5qdXgLAAEE9gEAAAQAAAAAUEsDBBQAAAAIABqDDl02uF+0QwEAAEgCAAARABwAd29yZC9kb2N1bWVudC54bWxVVAkAA9PQfmrT0H5qdXgLAAEE9gEAAAQAAAAAjVJBTsJAFN1zisnsbdGFMU1bAhhPoAeo7QhN6EwzU0V2RUPEKNEYEw0iiiiysXFnRDwNbWlXXMEpjTsW3by8n/nv/f9mRi4cWzVwhCgzCVbgupCHAGGdGCauKHBvd2dtCwLmaNjQagQjBTYQgwU1J9clg+iHFsIO4A6YSXUFVh3HlkSR6VVkaUwgNsL87IBQS3N4SStinVDDpkRHjPEBVk3cyOc3RUszMVRzAHDXfWI0ErosbJUDTcBR45f7+YO3mHajr3F8Oo7vxkHnyv/tBeeduOdGo+Z84EXeq//j+t/txfRJFhNVgnSJ9krXogC4a/h8lq29JAB/chF4/WztZe4+GYWPGZfZFkA0bMVvn9na5x+34YBH7RZL5WyK6H0Y9q+5Imi10+tKw8/cZhoruLlMF565JystE5I+UcL+v4Ca+wNQSwECHgMKAAAAAAAagw5dAAAAAAAAAAAAAAAABQAYAAAAAAAAABAA7UEAAAAAd29yZC9VVAUAA9PQfmp1eAsAAQT2AQAABAAAAABQSwECHgMUAAAACAAagw5dNrhftEMBAABIAgAAEQAYAAAAAAABAAAApIE/AAAAd29yZC9kb2N1bWVudC54bWxVVAUAA9PQfmp1eAsAAQT2AQAABAAAAABQSwUGAAAAAAIAAgCiAAAAzQEAAAAA'

describe('question import', () => {
  it('parses quoted CSV fields', () => {
    expect(parseCsvRows('题目,选项A\n"目标,事实与约束",先写清')).toEqual([
      ['题目', '选项A'],
      ['目标,事实与约束', '先写清'],
    ])
  })

  it('creates choice questions from CSV', () => {
    const questions = importQuestionsFromText('题目,题型,选项A,选项B,选项C,选项D,正确答案,解析\n协作第一步是什么,单选,写清目标,立即开会,等待分配,跳过沟通,A,先对齐事实')
    expect(questions).toHaveLength(1)
    expect(questions[0].correctOptionIds).toEqual(['a'])
  })

  it('creates choice questions from Word-style text', () => {
    const questions = importQuestionsFromText('题目：哪些属于协作前置条件？\nA. 目标\nB. 事实\nC. 约束\nD. 情绪\n答案：ABC\n解析：先写清目标、事实和约束')
    expect(questions).toHaveLength(1)
    expect(questions[0].type).toBe('multiple')
    expect(questions[0].correctOptionIds).toEqual(['a', 'b', 'c'])
  })

  it('extracts question text from a real docx archive', async () => {
    const bytes = Uint8Array.from(Buffer.from(docxFixture, 'base64'))
    const text = await extractDocxText(bytes.buffer)
    expect(text).toContain('跨部门协作前需要确认什么？')
    expect(importQuestionsFromText(text)).toHaveLength(1)
  })
})
