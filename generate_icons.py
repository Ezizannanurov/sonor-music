import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_sonor_logo(size=1024, is_foreground=False, is_maskable=False):
    # Render at 2x resolution for super-sampled anti-aliasing
    scale = 2
    W = size * scale
    H = size * scale
    
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = W / 2, H / 2
    
    if not is_foreground:
        # Dark sleek obsidian background
        for r in range(int(W * 0.75), 0, -4):
            t = r / (W * 0.75)
            cr = int(24 * (1 - t) + 9 * t)
            cg = int(24 * (1 - t) + 9 * t)
            cb = int(38 * (1 - t) + 14 * t)
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(cr, cg, cb, 255))
            
        # Subtle ambient neon glow in center
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        glow_radius = int(W * 0.35)
        for r in range(glow_radius, 0, -4):
            t = r / glow_radius
            alpha = int(50 * (1 - t**1.5))
            glow_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(124, 58, 237, alpha))
        glow = glow.filter(ImageFilter.GaussianBlur(radius=25 * scale))
        img = Image.alpha_composite(img, glow)
        draw = ImageDraw.Draw(img)

    # Content scaling:
    # Foreground & maskable need safe margins so circle/squircle masks don't clip
    if is_foreground:
        content_scale = 0.50
    elif is_maskable:
        content_scale = 0.52
    else:
        content_scale = 0.65
    
    emblem = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    edraw = ImageDraw.Draw(emblem)
    
    # Orbiting acoustic sound arcs (Sonar waves)
    arc_radius = W * content_scale * 0.56
    arc_pen_width = max(2, int(9 * scale))
    
    # Left acoustic wave arc
    edraw.arc(
        [cx - arc_radius, cy - arc_radius, cx + arc_radius, cy + arc_radius],
        start=135, end=225,
        fill=(56, 189, 248, 160),
        width=arc_pen_width
    )
    # Right acoustic wave arc
    edraw.arc(
        [cx - arc_radius, cy - arc_radius, cx + arc_radius, cy + arc_radius],
        start=315, end=405,
        fill=(168, 85, 247, 160),
        width=arc_pen_width
    )
    
    # Inner acoustic wave arcs
    inner_radius = arc_radius * 0.76
    edraw.arc(
        [cx - inner_radius, cy - inner_radius, cx + inner_radius, cy + inner_radius],
        start=140, end=220,
        fill=(56, 189, 248, 90),
        width=max(2, int(arc_pen_width * 0.7))
    )
    edraw.arc(
        [cx - inner_radius, cy - inner_radius, cx + inner_radius, cy + inner_radius],
        start=320, end=400,
        fill=(168, 85, 247, 90),
        width=max(2, int(arc_pen_width * 0.7))
    )

    # 5 Sound Wave Frequency Bars in the center
    bar_width = int(22 * scale)
    bar_spacing = int(16 * scale)
    num_bars = 5
    total_bars_width = num_bars * bar_width + (num_bars - 1) * bar_spacing
    start_x = cx - total_bars_width / 2
    
    bars_config = [
        (0.38, 0.08),
        (0.58, 0.05),
        (0.72, 0.0),
        (0.58, -0.05),
        (0.38, -0.08),
    ]
    
    max_h = W * content_scale
    
    for i, (h_ratio, y_shift) in enumerate(bars_config):
        bx = start_x + i * (bar_width + bar_spacing)
        bh = max_h * h_ratio
        by = cy + (max_h * y_shift) - (bh / 2)
        
        t = i / (num_bars - 1)
        if t <= 0.5:
            st = t / 0.5
            r = int(56 * (1 - st) + 168 * st)
            g = int(189 * (1 - st) + 85 * st)
            b = int(248 * (1 - st) + 247 * st)
        else:
            st = (t - 0.5) / 0.5
            r = int(168 * (1 - st) + 236 * st)
            g = int(85 * (1 - st) + 72 * st)
            b = int(247 * (1 - st) + 153 * st)
            
        radius = bar_width // 2
        edraw.rounded_rectangle([bx, by, bx + bar_width, by + bh], radius=radius, fill=(r, g, b, 255))
        
        # Internal white highlight
        highlight_w = max(2, bar_width // 4)
        hx = bx + (bar_width - highlight_w) / 2
        hh = bh * 0.75
        hy = by + (bh - hh) / 2
        edraw.rounded_rectangle([hx, hy, hx + highlight_w, hy + hh], radius=highlight_w // 2, fill=(255, 255, 255, 180))

    # Bloom
    bloom = emblem.copy().filter(ImageFilter.GaussianBlur(radius=6 * scale))
    emblem = Image.alpha_composite(bloom, emblem)
    
    img = Image.alpha_composite(img, emblem)
    final = img.resize((size, size), Image.Resampling.LANCZOS)
    return final

def make_round(im):
    size = im.size
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    output = Image.new('RGBA', size, (0, 0, 0, 0))
    output.paste(im, (0, 0))
    output.putalpha(mask)
    return output

def generate_all():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. PWA & Web icons
    print("Generating Web & PWA icons...")
    pwa_dir = os.path.join(base_dir, "public", "icons")
    os.makedirs(pwa_dir, exist_ok=True)
    
    icon_512 = create_sonor_logo(512, is_foreground=False)
    icon_512.save(os.path.join(pwa_dir, "icon-512.png"))
    
    icon_512_maskable = create_sonor_logo(512, is_foreground=False, is_maskable=True)
    icon_512_maskable.save(os.path.join(pwa_dir, "icon-512-maskable.png"))
    
    icon_192 = create_sonor_logo(192, is_foreground=False)
    icon_192.save(os.path.join(pwa_dir, "icon-192.png"))
    
    icon_apple = create_sonor_logo(180, is_foreground=False)
    icon_apple.save(os.path.join(pwa_dir, "apple-touch-icon.png"))
    
    # 2. Android Mipmap icons
    print("Generating Android mipmap icons...")
    res_dir = os.path.join(base_dir, "android", "app", "src", "main", "res")
    
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    
    # Master high-res images to scale from
    master_square = create_sonor_logo(512, is_foreground=False)
    master_foreground = create_sonor_logo(512, is_foreground=True)
    
    for folder, size in densities.items():
        target_folder = os.path.join(res_dir, folder)
        os.makedirs(target_folder, exist_ok=True)
        
        # Standard launcher icon
        sq = master_square.resize((size, size), Image.Resampling.LANCZOS)
        sq.save(os.path.join(target_folder, "ic_launcher.png"))
        
        # Round launcher icon
        rnd = make_round(sq)
        rnd.save(os.path.join(target_folder, "ic_launcher_round.png"))
        
        # Adaptive foreground
        fg_size = int(size * 108 / 48)
        fg = master_foreground.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
        fg.save(os.path.join(target_folder, "ic_launcher_foreground.png"))
        print(f"Generated {folder}: {size}x{size} & fg {fg_size}x{fg_size}")

if __name__ == "__main__":
    generate_all()
    print("All icons successfully generated!")
