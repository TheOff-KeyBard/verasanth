# LPC Women's Shirt Pack to Character Generator Plus Converter

Converts the LPC Women's Shirt Pack (female bases and clothing) into Character Generator Plus format.

## Quick Start

### GUI (recommended)

1. Run the GUI:
   ```bash
   python lpc_to_cgp_gui.py
   ```
2. Click **Add...** to add one or more LPC source folders (e.g. LPC Women's Shirt Pack, lpc-helmets). Use **Remove** to clear selected folders.
3. Choose output mode:
   - **Save to folder** — Convert to a local folder (default: `LPC_Converted_CGP`)
   - **Copy directly to CGP** — Convert and merge files into your Character Generator Plus install folder
4. If using "Copy directly to CGP", the CGP path is auto-detected from common Steam locations, or you can browse to it.
5. Click **Convert** to run, or **Preview** to see what would be copied without writing files.

### CLI

1. Ensure the LPC Women's Shirt Pack is in your Downloads folder.
2. Run the conversion:
   ```bash
   python convert_lpc_to_cgp.py
   ```
3. Output is written to `LPC_Womens_Shirt_Pack_CGP/`.

## Output Structure (CGP Format)

```
LPC_Womens_Shirt_Pack_CGP/
└── dlc/
    └── lpc/
        ├── Face/female/     FG_Body_p####.png, FG_Clothing_p####.png (from _preview.png)
        ├── SV/female/       SV_Body_p####.png, SV_Clothing_p####.png (from walk.png)
        ├── TV/female/       TV_Body_p####.png, TV_Clothing_p####.png (from walk.png)
        ├── TVD/female/      TVD_Body_p####.png, TVD_Clothing_p####.png (from hurt.png)
        └── Variation/female/  icon_AccA_p####.png (required by CGP for parts to show in UI)
```

The converter generates **Variation icons** (`icon_[Part]_p[number].png`) so converted parts appear in Character Generator Plus. Set `output_variation_icons: false` in `flat_packs` to disable.

- **Female Bases** → TV_Body, FG_Body, SV_Body, TVD_Body (p1002+)
- **Shirts** (Blouse, Corset, etc.) → TV_Clothing, FG_Clothing, SV_Clothing, TVD_Clothing (p1034+)

## Using with Character Generator Plus

1. Copy the contents of `LPC_Womens_Shirt_Pack_CGP/dlc/lpc/` into your CGP install folder:
   ```
   [CGP Install]\dlc\lpc\
   ```
   For example: `C:\Steam Games\steamapps\common\CharacterGeneratorPlus\dlc\lpc\`

2. Merge the Face, SV, TV, and TVD folders so the new PNG files sit alongside existing ones.

3. Launch Character Generator Plus; the new bodies and clothing should appear in the generator.

## Supported Pack Structures

- **Nested** (e.g. LPC Women's Shirt Pack): `[Component]/[Color]/[animation].png` — e.g. Female Blouse/Black/walk.png
- **Flat** (e.g. Children, helmets, hair): All PNGs in one folder — configured in `flat_packs.file_patterns`

### Flat pack types

| Type | Pattern | Part | Gender |
|------|---------|------|--------|
| Children | `child_walk_*.png` | Body | teen |
| Helmets | `*-male.png`, `*-female.png` | AccA | from filename |
| Hair | `*hair*.png`, `pembesac*.png` | RearHair1 | female |

Put helmets (e.g. `barbuta-male.png`, `barbarian-female.png`) or hair (e.g. `sr_f_hair_summer.png`) in a dedicated folder and select it as the source. The converter outputs to Face, SV, TV, and TVD with the correct CGP naming.

### Organizing with preset folders

Create folders named **MHelmets**, **FHelmets**, **MHair**, **FHair** and sort your LPC files into them. Any `*.png` in each folder is converted using the preset rules:

| Folder   | Part       | Gender |
|----------|------------|--------|
| MHelmets | AccA       | male   |
| FHelmets | AccA       | female |
| MHair    | RearHair1  | male   |
| FHair    | RearHair1  | female |
| MVisor   | AccA       | male   |
| FVisor   | AccA       | female |
| MAccessory | AccA     | male   |
| FAccessory | AccA     | female |

**Batch mode:** Select a parent folder containing these preset subfolders; the converter processes each one automatically.

**Skip existing:** When copying directly to CGP, enable "Skip files that already exist in CGP" (default: on) so only new files are copied. Re-run after adding more files to a preset folder without overwriting what's already there.

### Nested helmet packs (lpc-helmets style)

Packs that download with structure `helmet/[type]/[gender]/`, `accessory/[type]/[gender]/`, or `visor/[type]/[gender]/` (e.g. `lpc-helmets/helmet/barbarian/female/brass.png`) are detected automatically. **No sorting needed** — select the pack root (e.g. `d:\Game Assets\lpc-helmets`) and the converter processes **helmet**, **accessory**, and **visor** in one run. Part numbers are separated (helmet 1001+, accessory 1100+, visor 1200+) to avoid collisions. You can also select the `helmet` subfolder directly to convert only helmets.

## Customization

- **mapping_config.json** – Edit `cgp.start_part_number` for nested packs; `flat_packs` for flat packs.
- **settings.json** – Created by the GUI; stores last source path, CGP path, and output mode.
- **discover_cgp_structure.ps1** – Run from your CGP install folder to capture its structure.

## Requirements

- Python 3.8+
- No external dependencies (uses only stdlib)
