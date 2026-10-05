import os
from PIL import Image, ImageDraw, ImageFont

public_dir = r"D:\reliefgrid\reliefgrid\frontend\public"
os.makedirs(public_dir, exist_ok=True)

def create_pwa_icon(size: int, output_path: str):
    # Create high-res RGBA image
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background
    corner_radius = int(size * 0.22)
    # Gradient/Brand Crimson: #e11d48 -> (225, 29, 72)
    draw.rounded_rectangle(
        [(0, 0), (size, size)],
        radius=corner_radius,
        fill=(225, 29, 72, 255)
    )

    # Inner decorative border
    inset = int(size * 0.05)
    draw.rounded_rectangle(
        [(inset, inset), (size - inset, size - inset)],
        radius=int(corner_radius * 0.8),
        outline=(255, 255, 255, 50),
        width=max(2, int(size * 0.015))
    )

    # Draw White Emergency Relief Cross + Grid Motif
    center = size // 2
    cross_thick = int(size * 0.16)
    cross_length = int(size * 0.54)

    # Vertical bar of cross
    draw.rounded_rectangle(
        [
            (center - cross_thick // 2, center - cross_length // 2),
            (center + cross_thick // 2, center + cross_length // 2)
        ],
        radius=int(cross_thick * 0.25),
        fill=(255, 255, 255, 255)
    )

    # Horizontal bar of cross
    draw.rounded_rectangle(
        [
            (center - cross_length // 2, center - cross_thick // 2),
            (center + cross_length // 2, center + cross_thick // 2)
        ],
        radius=int(cross_thick * 0.25),
        fill=(255, 255, 255, 255)
    )

    # Save PNG
    img.save(output_path, "PNG")
    print(f"Generated {output_path} ({size}x{size})")

create_pwa_icon(192, os.path.join(public_dir, "pwa-192x192.png"))
create_pwa_icon(512, os.path.join(public_dir, "pwa-512x512.png"))
create_pwa_icon(180, os.path.join(public_dir, "apple-touch-icon.png"))
