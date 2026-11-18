"""Render the extension icons from the SVG sources.  Run from the project root:  python3 icons/render.py
Needs cairosvg (pip install cairosvg). 16/32 px use the simplified icon-small.svg."""
import cairosvg

for size in (16, 32, 48, 128):
    source = 'icons/icon-small.svg' if size < 48 else 'icons/icon.svg'
    cairosvg.svg2png(url=source, write_to=f'icons/icon{size}.png', output_width=size, output_height=size)
    print(f'icons/icon{size}.png  <-  {source}')
