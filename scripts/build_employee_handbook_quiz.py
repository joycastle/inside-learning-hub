import csv
import hashlib
import re
from pathlib import Path
from docx import Document

SOURCE = Path('/Users/jc/Downloads/员工手册问答对比｜全文阅读版.docx')
OUTPUT = Path('/Users/jc/Downloads/员工手册题库-单选题.csv')


def extract_items():
    paragraphs = [p.text.strip() for p in Document(SOURCE).paragraphs if p.text.strip()]
    items = []
    for index, text in enumerate(paragraphs):
        match = re.match(r'(\d+)\s*·\s*([^｜]+)｜(.+)', text)
        if not match:
            continue
        answer_index = next((i for i in range(index + 1, len(paragraphs)) if paragraphs[i] == '参考答案'), None)
        if answer_index is None:
            continue
        answer = []
        for paragraph in paragraphs[answer_index + 1:]:
            if paragraph == '助手答案' or re.match(r'\d+\s*·', paragraph):
                break
            answer.append(paragraph)
        items.append({
            'no': int(match.group(1)),
            'code': match.group(2).strip(),
            'question': match.group(3).strip(),
            'answer': '\n'.join(answer).strip(),
        })
    return items


def compact(text):
    return re.sub(r'依据[^。]*。?$', '', text).strip()


def mutate_numbers(text, offset):
    def replace(match):
        value = match.group(0)
        if ':' in value:
            hour, minute = value.split(':')
            return f'{int(hour) + offset}:{minute}'
        if '.' in value:
            return f'{float(value) + offset:.1f}'.rstrip('0').rstrip('.')
        return value

    return re.sub(r'\d+(?:\.\d+)?(?::\d+)?', replace, text)


def wrong_variants(question, answer):
    variants = []
    if '不可以' in answer:
        variants.append(answer.replace('不可以', '可以', 1))
    elif '可以' in answer:
        variants.append(answer.replace('可以', '不可以', 1))
    elif '不得' in answer:
        variants.append(answer.replace('不得', '可以', 1))
    elif '需要' in answer:
        variants.append(answer.replace('需要', '不需要', 1))
    else:
        variants.append(f'无需按照上述制度办理，员工可以自行决定。')

    if re.search(r'\d', answer):
        variants.append(mutate_numbers(answer, 1))
        variants.append(mutate_numbers(answer, 2))
    elif any(word in question for word in ['怎么', '如何', '怎么办', '申请']):
        variants.append('无需提前申请或获得审批，直接处理即可。')
        variants.append('只需口头告知同事，不需要在系统中留下记录。')
    else:
        variants.append('该事项完全由员工自行决定，不受公司制度约束。')
        variants.append('只要部门同事同意即可，无需遵守员工手册要求。')

    replacements = [
        ('正式员工', '实习生'),
        ('实习生', '正式员工'),
        ('部门负责人和 HR', '直属同事'),
        ('部门负责人、管理层和 HR', '部门负责人'),
        ('经批准', '未经批准'),
        ('工作日', '休息日'),
        ('公司', '员工个人'),
        ('飞书', '口头沟通'),
        ('系统', '聊天工具'),
        ('可以', '不可以'),
        ('不可以', '可以'),
        ('不得', '可以'),
        ('应当', '无需'),
        ('应', '无需'),
    ]
    for source, target in replacements:
        if source in answer:
            variants.append(answer.replace(source, target, 1))

    unique = []
    for variant in variants:
        variant = variant.strip()
        if variant and variant != answer and variant not in unique:
            unique.append(variant)
    topic = question.rstrip('？?')
    generic = [
        f'关于“{topic}”，员工无需按照《员工手册》办理，可以自行决定。',
        f'关于“{topic}”，只需口头告知同事，不需要审批或系统记录。',
        f'关于“{topic}”，该要求只适用于其他员工，本人无需遵守。',
    ]
    for variant in generic:
        if len(unique) >= 3:
            break
        if variant not in unique and variant != answer:
            unique.append(variant)
    return unique[:3]


def main():
    items = extract_items()
    groups = {}
    for item in items:
        group = item['code'].split('-')[0]
        groups.setdefault(group, []).append(item)

    rows = []
    for item in items:
        correct = compact(item['answer'])
        distractors = wrong_variants(item['question'], correct)
        seed = int(hashlib.sha256(item['code'].encode()).hexdigest()[:8], 16)
        correct_index = seed % 4
        options = distractors[:]
        options.insert(correct_index, correct)
        answer_letter = 'ABCD'[correct_index]
        rows.append([
            item['question'],
            '单选',
            '1',
            *options[:4],
            answer_letter,
            f"正确答案依据《员工手册》原文：{item['answer']}",
        ])

    with OUTPUT.open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.writer(handle)
        writer.writerow(['题目', '题型', '分类', '选项A', '选项B', '选项C', '选项D', '正确答案', '解析'])
        writer.writerows(rows)
    print(f'created {OUTPUT} ({len(rows)} questions)')


if __name__ == '__main__':
    main()
