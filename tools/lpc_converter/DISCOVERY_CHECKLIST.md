# Character Generator Plus Structure Discovery Checklist

Run these steps to capture the format CGP expects for custom LPC assets.

## Step 1: Locate Character Generator Plus

Find your Steam install folder, then navigate to:
```
steamapps/common/
```

Look for a folder named:
- `Character Generator Plus`
- `CharacterGeneratorPlus`
- Or similar (containing "Character" or "Hanmo")

## Step 2: Find LPC Character Resources

Inside the CGP folder, locate the LPC Character Resources DLC content. It may be in:
- A subfolder like `LPC Resources` or `Resources`
- A DLC folder
- A `data` or `assets` folder

## Step 3: Run Discovery Script

From PowerShell, run:
```powershell
cd "C:\Path\To\Character Generator Plus"
.\path\to\discover_cgp_structure.ps1 -CgpPath "."
```

Or if the script is in the lpc_converter folder:
```powershell
cd "D:\Verasanth Worker\tools\lpc_converter"
.\discover_cgp_structure.ps1 -CgpPath "C:\Path\To\Character Generator Plus"
```

Output: `cgp_structure.txt`

## Step 4: Capture Manually (if script fails)

1. Open the CGP folder in File Explorer
2. Note the folder depth: Component → Variant → Animation?
3. Copy the folder structure (e.g. 2–3 levels)
4. Note file naming: `component_color_animation.png` or `animation.png`?
5. List animation names used: idle, walk, run, slash, thrust, spellcast, shoot, hurt, etc.
6. Check for JSON/XML/config files that define components

## Step 5: Share the Results

Share `cgp_structure.txt` (or your notes) so the conversion config can be updated to match CGP exactly.
