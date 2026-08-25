import { describe, expect, it } from 'vitest'
import { normalizeMarkdown } from './normalize-markdown'

describe('normalizeMarkdown', () => {
  it('strips export artifacts from Word-style headings', () => {
    const source = [
      '# **一、出海休闲游戏行业通识**',
      '## **1\\. ****手游赛道类型**',
      '## **2\\. 休闲游戏的核心本质与用户特征**',
      '### **2\\.1****核心属性**',
      '### **4\\.1三消品类（Match\\-3）**',
      '## **6\\.****出海休闲****游戏****行业发展趋势**',
      '## **7****\\.行业必备了解核心知识**',
      '### **7****\\.1变现模式**',
      '### 4\\.1考勤管理制度',
      '## **厂商\\&产品**',
    ].join('\n')

    expect(normalizeMarkdown(source)).toBe([
      '# 一、出海休闲游戏行业通识',
      '## 1. 手游赛道类型',
      '## 2. 休闲游戏的核心本质与用户特征',
      '### 2.1 核心属性',
      '### 4.1 三消品类（Match-3）',
      '## 6. 出海休闲游戏行业发展趋势',
      '## 7. 行业必备了解核心知识',
      '### 7.1 变现模式',
      '### 4.1 考勤管理制度',
      '## 厂商&产品',
    ].join('\n'))
  })

  it('turns highlighted callouts into blockquotes and leaves fenced code alone', () => {
    const source = [
      '**【全球移动游戏仍是一门 800 亿美元级生意】**',
      '**【****为什么说“你来对了”】**',
      '```md',
      '## **1\\. ****保留原样**',
      '```',
    ].join('\n')

    expect(normalizeMarkdown(source)).toBe([
      '> 全球移动游戏仍是一门 800 亿美元级生意',
      '> 为什么说“你来对了”',
      '```md',
      '## **1\\. ****保留原样**',
      '```',
    ].join('\n'))
  })
})
