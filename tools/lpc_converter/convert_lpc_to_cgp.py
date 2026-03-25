#!/usr/bin/env python3
"""
LPC Women's Shirt Pack to Character Generator Plus Converter

Converts the LPC Women's Shirt Pack into Character Generator Plus format:
- dlc/lpc/Face/female/  FG_Clothing_p####.png (from _preview.png)
- dlc/lpc/SV/female/    SV_Clothing_p####.png (from walk.png)
- dlc/lpc/TV/female/    TV_Clothing_p####.png (from walk.png)
- dlc/lpc/TVD/female/   TVD_Clothing_p####.png (from hurt.png)

For Female Bases: TV_Body_p####.png, FG_Body_p####.png, etc.

Usage:
    python convert_lpc_to_cgp.py [--config mapping_config.json] [--output OUTPUT_PATH]
"""

import argparse
import json
import shutil
import sys
from pathlib import Path


def find_source_folder(config: dict) -> Path | None:
    """Locate the LPC Women's Shirt Pack folder."""
    downloads = Path.home() / "Downloads"
    candidates = [
        Path(config["source"]["path"]),
        downloads / "LPC Women's Shirt Pack",
        downloads / "LPC Women&#039;s Shirt Pack",
    ]
    for path in candidates:
        if path.exists():
            return path
    for item in downloads.iterdir():
        if item.is_dir() and "LPC" in item.name and "Shirt" in item.name:
            return item
    return None


def should_exclude(filename: str, exclude_patterns: list[str]) -> bool:
    """Check if file should be excluded from conversion."""
    for pattern in exclude_patterns:
        if pattern in filename:
            return True
    return False


def _is_nested_structure(source: Path, config: dict) -> bool:
    """Check if source has nested [Type]/[Color]/ structure."""
    dirs = [d for d in source.iterdir() if d.is_dir()]
    if not dirs:
        return False
    comp_map = config.get("component_mapping", {})
    for d in dirs[:5]:  # Sample first 5
        if d.name in comp_map:
            return True
    return False


def _gender_from_filename(filename: str, rules: dict) -> str:
    """Extract gender from filename using rules like {'-male': 'male', '-female': 'female'}."""
    name_lower = filename.lower()
    for pattern, gender in rules.items():
        if pattern.lower() in name_lower:
            return gender
    return "female"  # default


def _get_folder_preset(folder_name: str, config: dict) -> dict | None:
    """Return preset rules if folder name matches a known preset (e.g. MHelmets, FHair)."""
    presets = config.get("folder_presets", {})
    return presets.get(folder_name)


def _get_preset_subdirs(source: Path, config: dict) -> list[tuple[Path, str]]:
    """Return [(subdir_path, preset_name), ...] for subdirs that match folder presets."""
    presets = config.get("folder_presets", {})
    result = []
    for d in source.iterdir():
        if d.is_dir() and d.name in presets:
            result.append((d, d.name))
    return sorted(result, key=lambda x: x[1])


def _find_nested_acc_packs(source: Path, config: dict) -> list[tuple[Path, str, int]]:
    """
    Detect nested acc packs (helmet, accessory, visor) with [type]/[gender]/ structure.
    Returns [(root_path, cgp_part, part_start), ...] for each detected subfolder.
    """
    pack_config = config.get("nested_acc_packs", {})
    if not pack_config:
        pack_config = {"helmet": {"part": "AccA", "part_start": 1001}}

    result: list[tuple[Path, str, int]] = []

    for subdir_name, subcfg in pack_config.items():
        subdir = source / subdir_name
        if not subdir.is_dir():
            continue
        root = subdir
        dirs = [d for d in root.iterdir() if d.is_dir() and not d.name.startswith("_")]
        if not dirs:
            continue
        # Check if first subdir has female/ and male/ (or female.png, male.png)
        for d in dirs[:3]:
            has_female = (d / "female").is_dir() or (d / "female.png").is_file()
            has_male = (d / "male").is_dir() or (d / "male.png").is_file()
            if has_female or has_male:
                part = subcfg.get("part", "AccA")
                part_start = subcfg.get("part_start", 1001)
                result.append((root, part, part_start))
                break

    return result


def _is_nested_acc_root(source: Path, config: dict) -> bool:
    """Check if source itself has [type]/[gender]/ structure (e.g. helmet folder directly)."""
    dirs = [d for d in source.iterdir() if d.is_dir() and not d.name.startswith("_")]
    if not dirs:
        return False
    for d in dirs[:3]:
        has_female = (d / "female").is_dir() or (d / "female.png").is_file()
        has_male = (d / "male").is_dir() or (d / "male.png").is_file()
        if has_female or has_male:
            return True
    return False


def convert_flat_to_cgp(
    source: Path,
    output_base: Path,
    config: dict,
    dry_run: bool = False,
) -> tuple[int, int]:
    """Convert flat LPC packs (files in one folder) to CGP format."""
    flat_config = config.get("flat_packs", {})
    exclude = config.get("exclude_patterns", [".meta", ".DS_Store"])
    start_nums = config.get("cgp", {}).get("start_part_number", {})
    default_gender = flat_config.get("output_gender", "teen")
    gender_rules = flat_config.get("gender_from_filename", {})
    part_starts: dict[str, int] = dict(flat_config.get("part_starts", {}))
    part_starts.setdefault("Body", flat_config.get("body_start", start_nums.get("TV_Body", 1002)))
    part_starts.setdefault("AccA", 1001)
    part_starts.setdefault("RearHair1", 1001)
    part_suffix = flat_config.get("part_suffix", {})  # e.g. RearHair1: "_c1_m003"

    prefix_map = {"Face": "FG", "SV": "SV", "TV": "TV", "TVD": "TVD"}
    copied = 0

    output_variation = flat_config.get("output_variation_icons", True)

    def get_folders(g: str) -> dict:
        folders = {
            "Face": output_base / "dlc" / "lpc" / "Face" / g,
            "SV": output_base / "dlc" / "lpc" / "SV" / g,
            "TV": output_base / "dlc" / "lpc" / "TV" / g,
            "TVD": output_base / "dlc" / "lpc" / "TVD" / g,
        }
        if output_variation:
            folders["Variation"] = output_base / "dlc" / "lpc" / "Variation" / g
        return folders

    # Folder preset: MHelmets, FHelmets, MHair, FHair - use preset rules, all *.png
    preset = _get_folder_preset(source.name, config)
    if preset:
        part = preset.get("part", "AccA")
        gender = preset.get("gender", "female")
        pattern = preset.get("pattern", "*.png")
        suffix = preset.get("suffix", part_suffix.get(part, ""))
        part_start = part_starts.get(part, 1001)
        cgp_folders = get_folders(gender)
        files = sorted(f for f in source.glob(pattern) if f.is_file() and f.suffix.lower() == ".png" and not should_exclude(f.name, exclude))
        part_counter = part_start
        for src_file in files:
            part_num = part_counter
            part_counter += 1
            for folder_key, folder in cgp_folders.items():
                if folder_key == "Variation":
                    continue
                pfx = prefix_map.get(folder_key, folder_key[:2].upper())
                out_name = f"{pfx}_{part}_p{part_num:04d}{suffix}.png"
                out_file = folder / out_name
                if dry_run:
                    copied += 1
                    continue
                folder.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_file, out_file)
                copied += 1
            if output_variation and "Variation" in cgp_folders:
                var_folder = cgp_folders["Variation"]
                icon_name = f"icon_{part}_p{part_num:04d}{suffix}.png"
                icon_file = var_folder / icon_name
                if dry_run:
                    copied += 1
                else:
                    var_folder.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src_file, icon_file)
                    copied += 1
        return copied, 0

    patterns = flat_config.get("file_patterns", [])
    if not patterns:
        patterns = [{"pattern": "child_walk_*.png", "part": "Body", "outputs": ["TV", "SV", "TVD"]}]

    for rule in patterns:
        glob_pat = rule["pattern"]
        part = rule.get("part", "Body")
        outputs = rule.get("outputs", ["TV", "SV", "TVD"])
        part_start = rule.get("part_start", part_starts.get(part, 1001))
        use_gender_from_filename = rule.get("gender_from_filename", bool(gender_rules))
        rule_gender_rules = rule.get("gender_rules", gender_rules)
        rule_gender = rule.get("output_gender") or rule.get("gender")
        suffix = rule.get("suffix", part_suffix.get(part, ""))

        part_counter = part_start
        files = sorted(source.glob(glob_pat))

        for src_file in files:
            if not src_file.is_file() or should_exclude(src_file.name, exclude):
                continue
            if src_file.suffix.lower() != ".png":
                continue

            if use_gender_from_filename:
                gender = _gender_from_filename(src_file.name, rule_gender_rules)
            else:
                gender = rule_gender or default_gender
            cgp_folders = get_folders(gender)

            part_num = part_counter
            part_counter += 1

            for folder_key in outputs:
                folder = cgp_folders.get(folder_key)
                if not folder:
                    continue
                pfx = prefix_map.get(folder_key, folder_key[:2].upper())
                out_name = f"{pfx}_{part}_p{part_num:04d}{suffix}.png"
                out_file = folder / out_name

                if dry_run:
                    print(f"  [DRY] {src_file} -> {out_file}")
                    copied += 1
                    continue

                folder.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_file, out_file)
                copied += 1

            if output_variation and "Variation" in cgp_folders:
                var_folder = cgp_folders["Variation"]
                icon_name = f"icon_{part}_p{part_num:04d}{suffix}.png"
                icon_file = var_folder / icon_name
                if dry_run:
                    copied += 1
                else:
                    var_folder.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src_file, icon_file)
                    copied += 1

    return copied, 0


def convert_nested_acc_to_cgp(
    root: Path,
    output_base: Path,
    config: dict,
    part: str = "AccA",
    part_start: int = 1001,
    dry_run: bool = False,
) -> tuple[int, int]:
    """
    Convert nested acc packs ([type]/[gender]/ or [type]/[gender].png) to CGP.
    Handles lpc-helmets style: barbarian/female/brass.png, barbarian/male.png, etc.
    """
    exclude = config.get("exclude_patterns", [".meta", ".DS_Store"])
    flat_config = config.get("flat_packs", {})
    output_variation = flat_config.get("output_variation_icons", True)
    prefix_map = {"Face": "FG", "SV": "SV", "TV": "TV", "TVD": "TVD"}
    outputs = ["Face", "SV", "TV", "TVD"]
    copied = 0

    def get_folders(g: str) -> dict:
        folders = {
            "Face": output_base / "dlc" / "lpc" / "Face" / g,
            "SV": output_base / "dlc" / "lpc" / "SV" / g,
            "TV": output_base / "dlc" / "lpc" / "TV" / g,
            "TVD": output_base / "dlc" / "lpc" / "TVD" / g,
        }
        if output_variation:
            folders["Variation"] = output_base / "dlc" / "lpc" / "Variation" / g
        return folders

    part_counter = part_start
    for type_dir in sorted(root.iterdir()):
        if not type_dir.is_dir() or type_dir.name.startswith("_"):
            continue

        for gender in ["female", "male"]:
            files: list[Path] = []
            gender_dir = type_dir / gender
            gender_file = type_dir / f"{gender}.png"
            if gender_dir.is_dir():
                files = [f for f in gender_dir.iterdir() if f.is_file() and f.suffix.lower() == ".png" and not should_exclude(f.name, exclude)]
            if gender_file.is_file() and not should_exclude(gender_file.name, exclude):
                files.insert(0, gender_file)

            for src_file in sorted(files):
                part_num = part_counter
                part_counter += 1
                cgp_folders = get_folders(gender)
                for folder_key in outputs:
                    folder = cgp_folders[folder_key]
                    pfx = prefix_map[folder_key]
                    out_name = f"{pfx}_{part}_p{part_num:04d}.png"
                    out_file = folder / out_name
                    if dry_run:
                        copied += 1
                        continue
                    folder.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src_file, out_file)
                    copied += 1
                # Variation icon (CGP requires this for parts to show in UI)
                if output_variation and "Variation" in cgp_folders:
                    var_folder = cgp_folders["Variation"]
                    icon_name = f"icon_{part}_p{part_num:04d}.png"
                    icon_file = var_folder / icon_name
                    if dry_run:
                        copied += 1
                    else:
                        var_folder.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(src_file, icon_file)
                        copied += 1

    return copied, 0


def convert_to_cgp(
    source: Path,
    output_base: Path,
    config: dict,
    dry_run: bool = False,
) -> tuple[int, int]:
    """Convert LPC assets to CGP format. Returns (copied_count, skipped_count)."""
    comp_map = config["component_mapping"]
    cgp_config = config.get("cgp", {})
    anim_to_cgp = cgp_config.get("animation_to_cgp", {})
    start_nums = cgp_config.get("start_part_number", {})
    exclude = config.get("exclude_patterns", [".meta", ".DS_Store"])

    # Part numbers: one counter per part type (Clothing, Body)
    clothing_start = start_nums.get("TV_Clothing", 1034)
    body_start = start_nums.get("TV_Body", 1002)
    part_counters: dict[str, int] = {
        "Clothing": clothing_start,
        "Body": body_start,
    }

    flat_config = config.get("flat_packs", {})
    output_variation = flat_config.get("output_variation_icons", True)

    # CGP output folders: dlc/lpc/{Face,SV,TV,TVD}/female/
    cgp_folders = {
        "Face": output_base / "dlc" / "lpc" / "Face" / "female",
        "SV": output_base / "dlc" / "lpc" / "SV" / "female",
        "TV": output_base / "dlc" / "lpc" / "TV" / "female",
        "TVD": output_base / "dlc" / "lpc" / "TVD" / "female",
    }
    if output_variation:
        cgp_folders["Variation"] = output_base / "dlc" / "lpc" / "Variation" / "female"

    copied = 0
    skipped = 0

    for shirt_type_dir in sorted(source.iterdir()):
        if not shirt_type_dir.is_dir():
            continue

        shirt_name = shirt_type_dir.name
        if shirt_name not in comp_map:
            print(f"  [SKIP] Unknown component: {shirt_name}")
            skipped += 1
            continue

        comp_info = comp_map[shirt_name]
        is_body = comp_info.get("layer") == "base"
        part_prefix = "Body" if is_body else "Clothing"

        for color_dir in sorted(shirt_type_dir.iterdir()):
            if not color_dir.is_dir():
                continue

            # Collect animation files for this variant
            anim_files: dict[str, Path] = {}
            for file in color_dir.iterdir():
                if not file.is_file() or should_exclude(file.name, exclude):
                    continue
                if file.suffix.lower() != ".png":
                    continue
                anim_files[file.stem] = file

            # Map animations to CGP outputs
            # walk -> TV, SV
            # _preview -> Face
            # hurt -> TVD
            mappings: list[tuple[str, str, str]] = []
            if "walk" in anim_files:
                for dest in ["TV", "SV"]:
                    mappings.append((anim_files["walk"], dest, part_prefix))
            if "_preview" in anim_files:
                mappings.append((anim_files["_preview"], "Face", part_prefix))
            if "hurt" in anim_files:
                mappings.append((anim_files["hurt"], "TVD", part_prefix))

            if not mappings:
                continue

            # Use same part number for all outputs of this variant
            part_num = part_counters[part_prefix]
            part_counters[part_prefix] += 1

            for src_file, folder_key, prefix in mappings:
                folder = cgp_folders[folder_key]
                prefix_map = {"Face": "FG", "SV": "SV", "TV": "TV", "TVD": "TVD"}
                pfx = prefix_map[folder_key]
                out_name = f"{pfx}_{part_prefix}_p{part_num:04d}.png"
                out_file = folder / out_name

                if dry_run:
                    print(f"  [DRY] {src_file} -> {out_file}")
                    copied += 1
                    continue

                folder.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_file, out_file)
                copied += 1

            # Variation icon (CGP requires this for parts to show in UI)
            if output_variation and "Variation" in cgp_folders:
                icon_src = anim_files.get("_preview") or anim_files.get("walk")
                if icon_src:
                    var_folder = cgp_folders["Variation"]
                    icon_name = f"icon_{part_prefix}_p{part_num:04d}.png"
                    icon_file = var_folder / icon_name
                    if dry_run:
                        copied += 1
                    else:
                        var_folder.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(icon_src, icon_file)
                        copied += 1

    return copied, skipped


def run_conversion(
    source_path: Path,
    output_path: Path,
    config_path: Path | None = None,
    dry_run: bool = False,
) -> tuple[int, int]:
    """
    Run conversion for use by GUI or other callers.
    Returns (copied_count, skipped_count).
    """
    config_path = config_path or Path(__file__).parent / "mapping_config.json"
    if not config_path.exists():
        raise FileNotFoundError(f"Config not found: {config_path}")

    with open(config_path, encoding="utf-8") as f:
        config = json.load(f)

    if not source_path.exists():
        raise FileNotFoundError(f"Source folder not found: {source_path}")

    output_base = output_path
    if not output_base.is_absolute():
        output_base = Path(__file__).parent / output_base

    # Batch mode: source contains preset subdirs (MHelmets, FHelmets, MHair, FHair)
    preset_subdirs = _get_preset_subdirs(source_path, config)
    if preset_subdirs:
        total_copied, total_skipped = 0, 0
        for subdir, _ in preset_subdirs:
            c, s = convert_flat_to_cgp(subdir, output_base, config, dry_run=dry_run)
            total_copied += c
            total_skipped += s
        return total_copied, total_skipped

    # Nested acc packs: lpc-helmets style (helmet/, accessory/, visor/ with [type]/[gender]/)
    acc_packs = _find_nested_acc_packs(source_path, config)
    if acc_packs:
        total_copied, total_skipped = 0, 0
        for root, part, part_start in acc_packs:
            c, s = convert_nested_acc_to_cgp(root, output_base, config, part=part, part_start=part_start, dry_run=dry_run)
            total_copied += c
            total_skipped += s
        if total_copied > 0:
            return total_copied, total_skipped

    # Direct nested acc root (e.g. source is helmet/ folder itself)
    if _is_nested_acc_root(source_path, config):
        pack_config = config.get("nested_acc_packs", {}).get("helmet", {"part": "AccA", "part_start": 1001})
        copied, skipped = convert_nested_acc_to_cgp(
            source_path, output_base, config,
            part=pack_config.get("part", "AccA"),
            part_start=pack_config.get("part_start", 1001),
            dry_run=dry_run,
        )
        if copied > 0:
            return copied, skipped

    if _is_nested_structure(source_path, config):
        return convert_to_cgp(source_path, output_base, config, dry_run=dry_run)
    return convert_flat_to_cgp(source_path, output_base, config, dry_run=dry_run)


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert LPC Women's Shirt Pack to CGP format")
    parser.add_argument(
        "--config",
        default=Path(__file__).parent / "mapping_config.json",
        type=Path,
        help="Path to mapping config JSON",
    )
    parser.add_argument(
        "--output",
        default=None,
        type=Path,
        help="Output folder (default: LPC_Womens_Shirt_Pack_CGP in script directory)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be copied without copying",
    )
    args = parser.parse_args()

    config_path = args.config
    if not config_path.exists():
        print(f"Config not found: {config_path}")
        return 1

    with open(config_path, encoding="utf-8") as f:
        config = json.load(f)

    source = find_source_folder(config)
    if not source:
        print("Source folder (LPC Women's Shirt Pack) not found in Downloads.")
        return 1

    output_base = args.output or (Path(__file__).parent / config["output"]["path"])
    if not output_base.is_absolute():
        output_base = Path(__file__).parent / output_base

    print(f"Source:  {source}")
    print(f"Output:  {output_base}")
    print(f"Mode:    {'DRY RUN' if args.dry_run else 'COPY'}")
    print()

    copied, skipped = convert_to_cgp(source, output_base, config, dry_run=args.dry_run)

    print()
    print(f"Done. Copied: {copied}, Skipped: {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
