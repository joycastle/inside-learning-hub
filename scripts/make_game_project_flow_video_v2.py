from PIL import Image, ImageDraw, ImageFont
import os, math

W, H, FPS = 1600, 900, 30
OUT = '/Users/jc/Desktop/work/peixun/output'
FRAMES = '/tmp/game_project_flow_frames_v2'
os.makedirs(OUT, exist_ok=True)
os.makedirs(FRAMES, exist_ok=True)
FONT = '/System/Library/Fonts/Hiragino Sans GB.ttc'
BOLD = '/System/Library/Fonts/STHeiti Medium.ttc'

def f(size, bold=False): return ImageFont.truetype(BOLD if bold else FONT, size)
def rr(d, box, r, fill, outline=None, width=1): d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)
def wrap(d, text, font, width):
    lines=[]; line=''
    for ch in text:
        if d.textbbox((0,0), line+ch, font=font)[2] <= width or not line: line += ch
        else: lines.append(line); line=ch
    if line: lines.append(line)
    return lines
def tb(d, xy, text, font, fill, width, spacing=5, anchor='la'):
    d.multiline_text(xy, '\n'.join(wrap(d,text,font,width)), font=font, fill=fill, spacing=spacing, anchor=anchor)

SCENES = [
 ('01','灵感与机会','从一个想法开始','项目组','产品 / 策划 / 程序','把玩家需求变成可讨论的产品假设。','市场部','竞品研究 / 海外市场','我先验证题材、用户和竞品环境。','项目组','这是一个值得继续验证的方向。','确定验证方向'),
 ('02','立项判断','用市场和数据把把关','市场部','用户 / 竞品 / 机会判断','这个题材有机会，我们把目标人群和市场空间看清楚了。','数据中台','留存 / 收入 / 历史指标','从数据看，核心目标有机会达到。','项目组','目标清晰，资源可控，进入正式立项。','形成立项方案'),
 ('03','玩法设计','把想法拆成可执行的规则','关卡策划','关卡 / 难度 / 节奏','我来设计玩家每一步怎么玩、怎么逐步获得成就感。','系统与数值策划','功能规则 / 成长经济 / 平衡','系统和数值一起把长期体验算清楚。','组内美术','我同步准备原画、动效、UI 和场景需求。','输出设计方案'),
 ('04','版本制作','把设计做成真正可玩的版本','程序岗','功能开发 / 联调 / 测试','我负责把玩法、系统和数据接进可运行的版本。','组内美术','原画 / 动效 / UI / 场景','我来把视觉资源按版本节奏交付。','美术中心','卡册、AI 和通用美术支持，随时补位。','产出可玩版本'),
 ('05','测试打磨','让反馈驱动下一次优化','市场部','素材测试 / 人群测试','小预算先测素材和人群，找到玩家真正感兴趣的点。','数据中台','留存 / 点击 / 收入分析','数据告诉我们，第二关的流失需要优先处理。','项目组','收到，我们调整难度和体验，再快速验证。','完成版本优化'),
 ('06','发布上线','准备好，去见全世界的玩家','项目组','验收 / 修复 / 提交版本','版本验收完成，问题已关闭，准备提交商店。','市场部','商店 / 广告 / 首发计划','首发素材、商店页面和投放计划已就位。','项目组 + 市场部','版本与投放同步，正式上线。','进入运营阶段'),
 ('07','持续运营','上线不是终点，而是下一轮开始','玩家','真实反馈 / 新需求','玩家的喜欢与问题，会成为下一轮优化的起点。','数据中台','增长机会 / 问题定位','我从数据里找到机会，也定位需要解决的问题。','项目组 + 市场部','更新、投放、再验证，继续把产品做得更好。','回到下一轮迭代'),
]
TIMES = [3.5,7.0,7.5,7.5,7.5,6.0,7.5]
INTRO, OUTRO = 4.0, 5.0
TOTAL = INTRO + sum(TIMES) + OUTRO

NAVY=(16,36,64); BLUE=(28,92,154); CYAN=(95,205,226); GOLD=(255,193,85); WHITE=(245,249,252); MUTED=(160,184,201)

def bg(t):
    im=Image.new('RGB',(W,H),NAVY); d=ImageDraw.Draw(im)
    for y in range(0,H,6):
        q=y/H; c=tuple(int(NAVY[i]*(1-q)+((19,57,93)[i])*q) for i in range(3)); d.rectangle((0,y,W,y+6),fill=c)
    # understated grid and ambient light
    for x in range(-H,W,120): d.line((x,0,x+H,H),fill=(20,47,77),width=1)
    d.ellipse((1180,-250,1750,320),fill=(20,72,112))
    d.ellipse((-260,720,300,1180),fill=(18,52,83))
    return im

def label(d, x, y, text, fill=CYAN, size=14):
    rr(d,(x,y,x+len(text)*size+26,y+30),15,fill)
    d.text((x+13,y+15),text,font=f(size,True),fill=NAVY,anchor='lm')

def draw_nav(d, idx, progress):
    x0,y=90,92; gap=205
    d.text((90,34),'GAME PROJECT FLOW',font=f(14,True),fill=CYAN)
    d.text((1510,37),'新人培训 · 游戏项目闭环',font=f(15),fill=MUTED,anchor='ra')
    d.line((x0,y,x0+gap*6,y),fill=(62,102,132),width=4)
    for i in range(7):
        x=x0+gap*i; active=i<=idx
        if active: d.line((x0,y,x,y),fill=CYAN,width=4)
        d.ellipse((x-15,y-15,x+15,y+15),fill=CYAN if active else (49,82,112),outline=WHITE if i==idx else None,width=2)
        d.text((x,y),str(i+1),font=f(12,True),fill=NAVY if active else MUTED,anchor='mm')
        d.text((x,y+28),SCENES[i][1],font=f(12,True if i==idx else False),fill=WHITE if i==idx else MUTED,anchor='ma')

def card(d,x,y,w,h,accent,role,dept,quote,order):
    # visible shadow plus clean dark business card
    rr(d,(x+5,y+7,x+w+5,y+h+7),18,(8,23,43))
    rr(d,(x,y,x+w,y+h),18,(28,57,86),accent,2)
    d.ellipse((x+22,y+22,x+70,y+70),fill=accent)
    d.text((x+46,y+46),str(order),font=f(18,True),fill=NAVY,anchor='mm')
    d.text((x+86,y+27),role,font=f(22,True),fill=WHITE)
    d.text((x+86,y+59),dept,font=f(14),fill=MUTED)
    d.line((x+22,y+92,x+w-22,y+92),fill=(61,94,122),width=1)
    tb(d,(x+22,y+112),quote,font=f(16,True),fill=(224,235,242),width=w-44,spacing=5)

def draw_intro(t):
    im=bg(t); d=ImageDraw.Draw(im)
    d.text((100,250),'一款游戏，大家是怎么接力做出来的？',font=f(52,True),fill=WHITE)
    d.text((104,330),'从灵感、立项，到制作、上线，再回到下一轮迭代',font=f(25),fill=MUTED)
    d.line((106,405,710,405),fill=CYAN,width=5)
    for i,txt in enumerate(['想法','验证','设计','制作','发布','运营']):
        x=120+i*112; d.ellipse((x,477,x+32,509),fill=GOLD if i==0 else CYAN); d.text((x+16,536),txt,font=f(17,True),fill=WHITE,anchor='ma')
        if i<5: d.line((x+38,493,x+104,493),fill=(86,142,175),width=3)
    label(d,110,650,'新人培训 · 项目闭环',GOLD,16)
    return im

def draw_outro(t):
    im=bg(t); d=ImageDraw.Draw(im)
    d.text((800,190),'上线不是终点',font=f(48,True),fill=WHITE,anchor='ma')
    d.text((800,260),'而是下一轮开始',font=f(32),fill=CYAN,anchor='ma')
    cx,cy=800,500
    pts=[('玩家',cx,350),('数据',1040,500),('项目组',930,670),('市场',670,670),('反馈',560,500)]
    for i,(txt,x,y) in enumerate(pts):
        rr(d,(x-65,y-23,x+65,y+23),23,(29,66,98),CYAN,2); d.text((x,y),txt,font=f(16,True),fill=WHITE,anchor='mm')
        nx,ny=pts[(i+1)%len(pts)][1:]; d.line((x,y,nx,ny),fill=(81,157,188),width=3)
    d.ellipse((cx-100,cy-100,cx+100,cy+100),fill=GOLD,outline=(255,220,130),width=4)
    d.text((cx,cy-20),'看数据',font=f(24,True),fill=NAVY,anchor='mm'); d.text((cx,cy+20),'听反馈 · 做更新',font=f(18,True),fill=NAVY,anchor='mm')
    d.text((800,790),'下一版，我们继续冲！',font=f(28,True),fill=WHITE,anchor='ma')
    return im

def draw_scene(t, idx, local):
    sc=SCENES[idx]; im=bg(t); d=ImageDraw.Draw(im); draw_nav(d,idx,min(1,local/TIMES[idx]))
    d.text((90,170),sc[0],font=f(56,True),fill=GOLD)
    d.text((215,168),sc[2],font=f(34,True),fill=WHITE)
    d.text((215,219),sc[1],font=f(18),fill=CYAN)
    # input -> action -> output strip
    rr(d,(90,282,1510,360),18,(23,53,83),(47,94,129),1)
    for x,head,body,col in [(125,'输入','玩家/市场信号',GOLD),(630,'协作','部门接力推进',CYAN),(1135,'产出',sc[11],(108,225,178))]:
        d.text((x,302),head,font=f(15,True),fill=col); d.text((x,330),body,font=f(17,True),fill=WHITE)
        if x<1100: d.text((x+405,320),'→',font=f(24,True),fill=MUTED,anchor='mm')
    # smooth card entry for each team
    n=3; gap=28; x0=90; cw=(1420-gap*2)//3
    elapsed=max(0,local-0.8)
    cards=[(sc[3],sc[4],sc[5]),(sc[6],sc[7],sc[8]),(sc[9],'协作职责',sc[10])]
    for i,(role,dept,quote) in enumerate(cards):
        p=max(0,min(1,(elapsed-i*0.55)/0.45)); y=415+int(28*(1-p));
        if p<=0: continue
        card(d,x0+i*(cw+gap),y,cw,205, [GOLD,CYAN,(108,225,178)][i],role,dept,quote,i+1)
    d.text((90,700),'项目闭环 / '+sc[0]+' '+sc[1],font=f(14,True),fill=MUTED)
    d.line((90,754,1510,754),fill=(55,95,125),width=5)
    d.line((90,754,90+int(1420*local/TIMES[idx]),754),fill=GOLD,width=5)
    d.text((1510,795),f'0:{int(t):02d} / 0:{int(TOTAL):02d}',font=f(14),fill=MUTED,anchor='ra')
    return im

def main():
    for i in range(int(TOTAL*FPS)):
        t=i/FPS
        if t<INTRO: im=draw_intro(t)
        elif t<INTRO+sum(TIMES):
            q=t-INTRO; acc=0; idx=0
            while idx<6 and q>=acc+TIMES[idx]: acc+=TIMES[idx]; idx+=1
            im=draw_scene(t,idx,q-acc)
        else: im=draw_outro(t-(INTRO+sum(TIMES)))
        im.save(os.path.join(FRAMES,f'frame_{i:05d}.png'))
    print(f'created {int(TOTAL*FPS)} frames, {TOTAL:.1f}s')

if __name__=='__main__': main()
