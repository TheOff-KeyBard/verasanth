#!/usr/bin/env python3
"""
LPC Women's Shirt Pack - Source Structure Discovery
Outputs the folder structure to lpc_source_structure.txt for reference.
"""

import os
from pathlib import Path

# Handle apostrophe in folder name (Windows may use different encodings)
SOURCE_BASE = Path(os.path.expanduser("~")) / "Downloads"
POSSIBLE_NAMES = [
    "LPC Women's Shirt Pack",
    "LPC Women&#039;s Shirt Pack",  # HTML entity encoding
]
OUTPUT_FILE = Path(__file__).parent / "lpc_source_structure.txt"


def find_source_folder() -> Path | None:
    for name in POSSIBLE_NAMES:
        candidate = SOURCE_BASE / name
        if candidate.exists():
            return candidate
    # Try listing Downloads to find partial match
    for item in SOURCE_BASE.iterdir():
        if item.is_dir() and "LPC" in item.name and "Shirt" in item.name:
            return item
    return None


def main():
    source = find_source_folder()
    if not source:
        print(f"Source folder not found in {SOURCE_BASE}")
        print("Tried:", POSSIBLE_NAMES)
        return 1

    lines = [f"Source: {source}\n", "=" * 60 + "\n\n"]

    for shirt_type in sorted(source.iterdir()):
        if not shirt_type.is_dir():
            continue
        lines.append(f"{shirt_type.name}/\n")
        for color in sorted(shirt_type.iterdir()):
            if not color.is_dir():
                continue
            files = [f.name for f in color.iterdir() if f.is_file() and f.suffix == ".png"]
            lines.append(f"  {color.name}/: {', '.join(sorted(files))}\n")
        lines.append("\n")

    OUTPUT_FILE.write_text("".join(lines), encoding="utf-8")
    print(f"Structure saved to {OUTPUT_FILE}")
    return 0


if __name__ == "__main__":
    exit(main())
