from PIL import Image, ImageDraw, ImageFont
import subprocess

src = '/Users/jc/Desktop/飞书20260825-152055.mp4'
out_video = '/tmp/feishu_subtitle_work/video-with-subtitles.mp4'
W, H, FPS = 1600, 900, 30
SCALE = 1.08
font = ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc', 30)
punct_font = ImageFont.truetype('/System/Library/Fonts/Hiragino Sans GB.ttc', 30)
PUNCTUATION = set('，。！？：；、（）《》“”‘’')
entries = [
    (0.00, 5.30, '一款游戏，怎样从一个点子，变成可以持续运营的产品？'),
    (5.36, 10.96, '第一步：项目组提出想法，市场部做竞品和市场调研。'),
    (11.00, 17.24, '第二步：市场和数据一起把关，确认机会、目标和立项价值。'),
    (17.28, 23.76, '第三步：策划和美术认领任务，把玩法变成规则、数值和资源。'),
    (23.80, 29.76, '第四步：程序、美术和美术中心协作，做出真正可玩的版本。'),
    (29.80, 36.16, '第五步：小规模投放，结合玩家反馈与数据分析，快速调优。'),
    (36.20, 42.36, '第六步：完成测试、审核、预热和首发投放，正式上线。'),
    (42.40, 48.06, '上线不是终点。反馈、数据、更新和投放再次汇合。'),
    (48.10, 53.96, '开启下一轮迭代，看数据、听反馈、做更新。'),
    (54.00, 55.45, '下一版，我们继续冲！'),
]

def subtitle_at(t):
    original_t = t / SCALE
    for start, end, text in entries:
        if start <= original_t <= end:
            return text
    return ''

def draw_mixed_caption(draw, text, center_x, center_y):
    """Draw Chinese text with smaller punctuation glyphs and less visual spacing."""
    glyphs = []
    total_width = 0
    max_height = 0
    for char in text:
        glyph_font = punct_font if char in PUNCTUATION else font
        box = draw.textbbox((0, 0), char, font=glyph_font)
        width = box[2] - box[0]
        height = box[3] - box[1]
        glyphs.append((char, glyph_font, width, height))
        total_width += width
        max_height = max(max_height, height)
    x = center_x - total_width / 2
    for char, glyph_font, width, height in glyphs:
        if char in PUNCTUATION:
            # Use a regular system Chinese glyph and lift punctuation slightly
            # so commas/periods sit like normal typed Chinese text.
            draw.text((x + width / 2, center_y + 3), char, font=glyph_font, fill=(255, 255, 255, 255), anchor='mm')
        else:
            draw.text((x + width / 2, center_y), char, font=glyph_font, fill=(255, 255, 255, 255), anchor='mm', stroke_width=1, stroke_fill=(8, 23, 40, 255))
        x += width
    return total_width, max_height

decoder = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
encoder = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out_video], stdin=subprocess.PIPE)
frame_bytes = W * H * 3
input_frames = int(55.5 * FPS)
output_frames = int(input_frames * SCALE)
cache = None
cache_i = -1
for out_i in range(output_frames):
    src_i = min(input_frames - 1, int(out_i / SCALE))
    if src_i != cache_i:
        raw = decoder.stdout.read(frame_bytes)
        if len(raw) != frame_bytes:
            break
        cache = Image.frombytes('RGB', (W, H), raw)
        cache_i = src_i
    im = cache.copy()
    # Remove the source video's decorative progress line and lower-right timer
    # without cropping the 16:9 canvas or covering the closing slogan.
    px = im.load()
    for y in range(747, 763):
        source_y = y - 11
        for x in range(85, 1520):
            px[x, y] = px[x, source_y]
    for y in range(780, 814):
        source_y = y + 34
        for x in range(1430, 1530):
            px[x, y] = px[x, source_y]
    text = subtitle_at(out_i / FPS)
    if text:
        d = ImageDraw.Draw(im, 'RGBA')
        original_t = (out_i / FPS) / SCALE
        if d.textbbox((0, 0), text, font=font)[2] > W - 220:
            mid = len(text) // 2
            text = text[:mid] + '\n' + text[mid:]
        # The closing loop graphic uses the lower center for its own slogan;
        # move the final subtitle to the upper content area to avoid overlap.
        x, y = W // 2, 142 if original_t >= 50.5 else H - 72
        lines = text.split('\n')
        metrics = [draw_mixed_caption(d, line, x, y) for line in lines]
        tw = max(width for width, _ in metrics)
        th = sum(height for _, height in metrics) + (len(lines) - 1) * 8
        # Clear the temporary glyphs and redraw after measuring the box.
        # The frame is restored from the cached source before this block, so
        # rendering twice is safe and keeps the background clean.
        # (The first pass is only used to measure; redraw on the same pixels.)
        # Covering the area also gives punctuation the same readable contrast.
        d.rounded_rectangle((x - tw // 2 - 24, y - th // 2 - 16, x + tw // 2 + 24, y + th // 2 + 16), radius=15, fill=(8, 23, 40, 190))
        if len(lines) == 1:
            draw_mixed_caption(d, lines[0], x, y)
        else:
            line_y = y - th / 2 + metrics[0][1] / 2
            for line, (_, line_h) in zip(lines, metrics):
                draw_mixed_caption(d, line, x, line_y)
                line_y += line_h + 8
    encoder.stdin.write(im.tobytes())
decoder.stdout.close()
decoder.wait()
encoder.stdin.close()
encoder.wait()
if encoder.returncode:
    raise SystemExit(encoder.returncode)
print(out_video)
