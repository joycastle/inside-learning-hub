from PIL import Image, ImageDraw, ImageFont
import os, math, textwrap

W, H, FPS = 1280, 720, 30
OUT = '/Users/jc/Desktop/work/peixun/output'
FRAMES = '/tmp/game_project_flow_frames'
os.makedirs(OUT, exist_ok=True)
os.makedirs(FRAMES, exist_ok=True)

FONT = '/System/Library/Fonts/Hiragino Sans GB.ttc'
FONT_BOLD = '/System/Library/Fonts/STHeiti Medium.ttc'

def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)

def fit_text(draw, text, fnt, max_width):
    words = list(text)
    lines, line = [], ''
    for ch in words:
        trial = line + ch
        if draw.textbbox((0, 0), trial, font=fnt)[2] <= max_width or not line:
            line = trial
        else:
            lines.append(line)
            line = ch
    if line:
        lines.append(line)
    return lines

def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def text_block(draw, xy, text, fnt, fill, max_width, spacing=5, anchor='la'):
    lines = fit_text(draw, text, fnt, max_width)
    draw.multiline_text(xy, '\n'.join(lines), font=fnt, fill=fill, spacing=spacing, anchor=anchor)
    return len(lines)

SCENES = [
    dict(step='01', label='灵感出现', title='项目组先把点子说出来', hint='所有项目，都从一个“玩家可能会喜欢”的想法开始。', color='#FFB84A', people=[('项目组','产品 · 策划 · 程序','诶！我有一个想法——做一款三分钟就能玩一局的轻松小游戏！','想'),('市场部','海外市场与竞品','好呀！那我来做竞品调研和市场调研。','研')]),
    dict(step='02', label='判断值不值得做', title='市场和数据一起“把把关”', hint='先验证方向，再投入更多时间和成本。', color='#69B7FF', people=[('市场部','找用户 · 看竞品','这个题材在海外有机会！','市'),('数据中台','看历史数据和指标','留存和收入目标也能达到。','数'),('项目组','确认立项方案','好，那我们正式立项！','立')]),
    dict(step='03', label='设计玩法', title='大家开始各自认领任务', hint='把一句想法，变成玩家真的能玩的规则。', color='#A77BFF', people=[('关卡策划','关卡 · 难度 · 节奏','好诶，让我来想想关卡怎么设定！','关'),('系统策划','系统与功能规则','让我看看系统怎么开发！','系'),('数值策划','成长 · 经济 · 平衡','我来把成长和经济算清楚！','值'),('组内美术','原画 · 动效 · UI · 场景','原画、动效、UI，交给我！','美')]),
    dict(step='04', label='做出可玩版本', title='大家一起把游戏做出来', hint='组内程序与美术是项目主力，美术中心提供能力支持。', color='#55C7A2', people=[('程序岗','U3D · Cocos · Python · 测试','功能开发和测试，我来负责！','程'),('组内美术','原画 · 动效 · UI · 场景','我来完成项目里的美术资源！','美'),('美术中心','卡册 · AI · 通用支持','需要卡册和 AI 支持，随时找我！','中')]),
    dict(step='05', label='测试与打磨', title='用玩家反馈，快速变得更好玩', hint='小规模投放和数据分析，帮助团队找到真正的问题。', color='#FF8E86', people=[('市场部','小预算测试素材和人群','玩家更喜欢这个广告！','投'),('数据中台','分析留存 · 点击 · 收入','第二关掉人有点多。','析'),('项目组','修问题 · 调难度 · 提体验','收到，马上优化！','优')]),
    dict(step='06', label='发布上线', title='准备好，去见全世界的玩家', hint='审核、预热、首发投放，一个环节都不能少。', color='#FFB84A', people=[('项目组','测试 · 修复 · 提交版本','版本测试完成，准备提交！','验'),('市场部','商店 · 广告 · 首发计划','首发素材和投放准备好了！上线！','上')]),
    dict(step='07', label='持续运营', title='上线不是终点，而是下一轮开始', hint='大家继续接力，让游戏更好玩、更多人看到、长期有收益。', color='#69B7FF', people=[('玩家','反馈喜欢与问题','这个活动好玩！这里还能再优化。','玩'),('数据中台','找到增长机会','数据收到，我来找问题和机会！','数'),('项目组与市场部','更新 · 投放 · 再验证','收到，我们马上开始下一轮迭代！','迭')], finale=True),
]

# The timing follows the original HTML's rhythm: each role enters in sequence,
# dialogue stays visible, and the last scene resolves into the loop conclusion.
durations = [4.6, 6.2, 7.7, 6.2, 6.2, 4.6, 10.3]
total = sum(durations)

def bg_for(t):
    # warm-to-cool paper gradient, redrawn per frame so this is a standalone animation
    top = (255, 249, 235)
    bot = (231, 247, 255)
    p = (math.sin(t * 0.25) + 1) / 2
    im = Image.new('RGB', (W, H), top)
    gd = ImageDraw.Draw(im)
    for y in range(0, H, 4):
        q = y / H
        c = tuple(int(top[i] * (1-q) + bot[i] * q) for i in range(3))
        gd.rectangle((0, y, W, y+4), fill=c)
    return im

def draw_icon(draw, cx, cy, label, color, scale=1.0):
    r = int(29 * scale)
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=color)
    draw.text((cx, cy), label, font=font(int(21*scale), True), fill='#17324D', anchor='mm')

def draw_frame(t):
    im = bg_for(t)
    d = ImageDraw.Draw(im)
    # header
    d.text((64, 34), '一款游戏，大家是怎么接力做出来的？', font=font(30, True), fill='#17324D')
    d.text((66, 78), '新人培训 · 游戏项目闭环', font=font(16), fill='#6A8294')
    d.text((1215, 49), 'PROJECT LOOP', font=font(14, True), fill='#6A8294', anchor='ra')
    # locate scene
    acc = 0
    idx = 0
    while idx < len(SCENES)-1 and t >= acc + durations[idx]:
        acc += durations[idx]; idx += 1
    sc = SCENES[idx]
    local = t - acc
    shown = min(len(sc['people']), int(local / 1.5) + 1)
    if idx == len(SCENES)-1 and local >= len(sc['people']) * 1.5 + 1.4:
        shown = 0
    # main panel
    rounded(d, (48, 125, 1232, 640), 28, '#FFFFFF', '#D9E8EF', 2)
    rounded(d, (78, 154, 160, 198), 20, '#17324D')
    d.text((119, 176), sc['step'], font=font(20, True), fill='#FFFFFF', anchor='mm')
    d.text((183, 160), sc['label'], font=font(18, True), fill=sc['color'])
    d.text((183, 188), sc['title'], font=font(28, True), fill='#17324D')
    d.text((183, 224), sc['hint'], font=font(15), fill='#657C8D')
    # role cards and arrows
    if shown:
        n = len(sc['people'])
        card_w = min(250, int(1040 / n) - 10)
        gap = 12
        total_w = n * card_w + (n-1) * gap
        x0 = (W-total_w)//2
        y0 = 268
        for i, (name, duty, line, badge) in enumerate(sc['people'][:shown]):
            x = x0 + i*(card_w+gap)
            prog = max(0, min(1, (local - i*1.5)/0.55))
            yy = int(y0 + 32*(1-prog))
            alpha = int(255*prog)
            fill = '#FFFFFF'
            rounded(d, (x, yy, x+card_w, yy+164), 18, fill, sc['color'], 3)
            # shadow
            d.rounded_rectangle((x+3, yy+7, x+card_w+3, yy+171), radius=18, fill='#DCEAF1')
            rounded(d, (x, yy, x+card_w, yy+164), 18, fill, sc['color'], 3)
            draw_icon(d, x+39, yy+38, badge, sc['color'])
            d.text((x+78, yy+27), name, font=font(17, True), fill='#17324D')
            text_block(d, (x+18, yy+75), duty, font(13), '#718796', card_w-36, spacing=2)
            rounded(d, (x+15, yy+113, x+card_w-15, yy+150), 12, '#FFF5D9')
            text_block(d, (x+25, yy+121), line, font(12, True), '#4C6474', card_w-50, spacing=2)
            if i < shown-1:
                d.text((x+card_w+gap//2, yy+76), '➜', font=font(23, True), fill='#FF9C42', anchor='mm')
    # dialogue strip / finale
    if shown:
        ty = 470
        for i, (name, duty, line, badge) in enumerate(sc['people'][:shown]):
            rounded(d, (150, ty+i*42, 1130, ty+34+i*42), 12, '#FFF5D9')
            d.text((171, ty+17+i*42), f'{name}：{line}', font=font(14, True), fill='#4D6575', anchor='lm')
    else:
        # final scene is a newly drawn loop graphic, not the original HTML surface
        cx, cy = 640, 414
        d.ellipse((cx-92, cy-92, cx+92, cy+92), fill='#FFCF5B', outline='#E7A764', width=5)
        d.text((cx, cy-16), '下一版', font=font(28, True), fill='#17324D', anchor='mm')
        d.text((cx, cy+22), '继续冲！', font=font(24, True), fill='#17324D', anchor='mm')
        ring = [('玩家',0),('数据',60),('项目组',120),('市场',180),('更新',240),('反馈',300)]
        for label, deg in ring:
            a = math.radians(deg - 90)
            x, y = cx + int(215*math.cos(a)), cy + int(135*math.sin(a))
            rounded(d, (x-60,y-19,x+60,y+19), 19, '#FFFFFF', '#A6D4EE', 2)
            d.text((x,y), label, font=font(15, True), fill='#17324D', anchor='mm')
            d.text((cx + int(154*math.cos(a)), cy + int(96*math.sin(a))), '➜', font=font(17, True), fill='#FF9C42', anchor='mm')
        d.text((640, 585), '看数据、听反馈、做更新！', font=font(20, True), fill='#17324D', anchor='mm')
    # progress
    d.rounded_rectangle((64, 682, 1216, 690), radius=4, fill='#D7E8EF')
    d.rounded_rectangle((64, 682, 64 + int(1152*t/total), 690), radius=4, fill='#FF9C73')
    d.text((1216, 702), f'0:{int(t):02d} / 0:{int(total):02d}', font=font(12), fill='#6B8292', anchor='ra')
    return im

if __name__ == '__main__':
    frames = int(total * FPS)
    for i in range(frames):
        draw_frame(i/FPS).save(os.path.join(FRAMES, f'frame_{i:05d}.png'))
    print(f'created {frames} frames in {FRAMES}; duration={total:.1f}s')
