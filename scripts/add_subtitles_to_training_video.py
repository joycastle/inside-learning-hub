from pathlib import Path

SCALE = 1.08  # slightly slower for training use; keeps the original voice natural
entries = [
    (0.10, 3.80, '一款游戏，怎样从一个点子，变成可以持续运营的产品？'),
    (4.20, 7.55, '第一步，项目组提出想法，市场部做竞品和市场调研。'),
    (7.75, 12.15, '第二步，市场和数据一起把关，确认机会、目标和立项价值。'),
    (12.35, 17.10, '第三步，策划和美术认领任务，把玩法变成规则、数值和资源。'),
    (17.30, 21.70, '第四步，程序、美术和美术中心协作，做出真正可玩的版本。'),
    (21.90, 26.25, '第五步，小规模投放，结合玩家反馈与数据分析，快速调优。'),
    (26.45, 30.90, '第六步，完成测试、审核、预热和首发投放，正式上线。'),
    (31.15, 36.70, '上线不是终点。反馈、数据、更新和投放再次汇合，开启下一轮迭代。'),
    (37.00, 40.20, '看数据，听反馈，做更新。'),
    (40.45, 44.50, '下一版，我们继续冲！'),
]

def stamp(seconds):
    ms = int(seconds * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'

out = []
for i, (start, end, text) in enumerate(entries, 1):
    out += [str(i), f'{stamp(start*SCALE)} --> {stamp(end*SCALE)}', text, '']
Path('/tmp/feishu_subtitle_work/training.srt').write_text('\n'.join(out), encoding='utf-8')
ass = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1600
PlayResY: 900
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,PingFang SC,30,&H00FFFFFF,&H00FFFFFF,&H0015283D,&H8015283D,0,0,0,0,100,100,0,0,1,3,1,2,80,80,48,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
for start, end, text in entries:
    ass += f'Dialogue: 0,{stamp(start*SCALE).replace(",", ".")},{stamp(end*SCALE).replace(",", ".")},Default,,0,0,0,,{text}\n'
Path('/tmp/feishu_subtitle_work/training.ass').write_text(ass, encoding='utf-8-sig')
print(Path('/tmp/feishu_subtitle_work/training.srt').read_text())
