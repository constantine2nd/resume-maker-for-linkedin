#!/usr/bin/env python3
"""Build the Chrome Web Store upload package:  python3 scripts/build.py  ->  dist/resume-maker-for-linkedin-<version>.zip

Packs only what the extension needs at runtime (no tests, docs, store assets, SVG sources or .git) and checks that
every file the manifest and resume.html refer to is in the package. Run from anywhere; paths are relative to the repo.
"""
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RUNTIME = ['manifest.json', 'resume.html', 'LICENSE', 'src/*.js', 'src/*.css', 'icons/*.png']


def referenced_files(manifest):
    """Every file path the manifest and resume.html point to."""
    refs = set(manifest.get('icons', {}).values())
    refs |= set(manifest.get('action', {}).get('default_icon', {}).values())
    if 'background' in manifest:
        refs.add(manifest['background']['service_worker'])
    for cs in manifest.get('content_scripts', []):
        refs |= set(cs.get('js', [])) | set(cs.get('css', []))
    for war in manifest.get('web_accessible_resources', []):
        refs |= set(war.get('resources', []))
    html = (ROOT / 'resume.html').read_text(encoding='utf-8')
    refs |= set(re.findall(r'(?:src|href)="([^"#:]+)"', html))
    return refs


def main():
    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    files = sorted({p.relative_to(ROOT).as_posix() for pattern in RUNTIME for p in ROOT.glob(pattern) if p.is_file()})

    problems = [f'referenced but missing from the package: {r}' for r in sorted(referenced_files(manifest)) if r not in files]
    if len(manifest.get('description', '')) > 132:
        problems.append('manifest description is longer than 132 characters')
    if len(manifest.get('name', '')) > 75:
        problems.append('manifest name is longer than 75 characters')
    if problems:
        sys.exit('Build failed:\n  ' + '\n  '.join(problems))

    out = ROOT / 'dist' / f"resume-maker-for-linkedin-{manifest['version']}.zip"
    out.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(ROOT / f, f)

    print(f"{out.relative_to(ROOT)}  ({out.stat().st_size // 1024} KB, {len(files)} files)")
    for f in files:
        print('  ' + f)


if __name__ == '__main__':
    main()
