#!/usr/bin/env python3
"""
LPC to CGP GUI Converter

GUI for converting LPC asset folders to Character Generator Plus format.
Supports output to a local folder or direct copy into the CGP install folder.
"""

import json
import shutil
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

# Import conversion logic from sibling module
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(SCRIPT_DIR))
try:
    from convert_lpc_to_cgp import run_conversion
except ImportError:
    run_conversion = None

CONFIG_PATH = SCRIPT_DIR / "mapping_config.json"
SETTINGS_PATH = SCRIPT_DIR / "settings.json"
DEFAULT_OUTPUT = "LPC_Converted_CGP"

CGP_SEARCH_PATHS = [
    Path(r"C:\Steam Games\steamapps\common\CharacterGeneratorPlus"),
    Path(r"C:\Program Files (x86)\Steam\steamapps\common\CharacterGeneratorPlus"),
    Path(r"C:\Program Files\Steam\steamapps\common\CharacterGeneratorPlus"),
    Path.home() / "Steam" / "steamapps" / "common" / "CharacterGeneratorPlus",
]


def load_settings() -> dict:
    """Load persisted settings."""
    if SETTINGS_PATH.exists():
        try:
            with open(SETTINGS_PATH, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def save_settings(settings: dict) -> None:
    """Persist settings."""
    try:
        with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)
    except OSError:
        pass


def find_cgp_path() -> str:
    """Auto-detect Character Generator Plus install path."""
    for p in CGP_SEARCH_PATHS:
        if p.exists() and (p / "CharacterGeneratorPlus.exe").exists():
            return str(p)
    return ""


class LPCToCGPApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("LPC to CGP Converter")
        self.root.minsize(500, 400)
        self.root.geometry("600x500")

        self.settings = load_settings()
        self.output_var = tk.StringVar(value=self.settings.get("output_folder", str(SCRIPT_DIR / DEFAULT_OUTPUT)))
        srcs = self.settings.get("source_folders")
        if srcs is not None:
            self.source_list: list[str] = list(srcs)
        else:
            last = self.settings.get("last_source", "")
            self.source_list = [last] if last else []
        self.cgp_var = tk.StringVar(value=self.settings.get("cgp_path", "") or find_cgp_path())
        self.mode_var = tk.StringVar(value=self.settings.get("output_mode", "folder"))
        self.skip_existing_var = tk.BooleanVar(value=self.settings.get("skip_existing", True))

        self._build_ui()

    def _build_ui(self) -> None:
        main = ttk.Frame(self.root, padding=10)
        main.pack(fill=tk.BOTH, expand=True)

        # Source folders
        ttk.Label(main, text="LPC Source Folders:").grid(row=0, column=0, sticky=tk.NW, pady=(0, 4))
        src_frame = ttk.Frame(main)
        src_frame.grid(row=1, column=0, columnspan=2, sticky=tk.NSEW, pady=(0, 8))
        self.root.columnconfigure(0, weight=1)
        main.columnconfigure(0, weight=1)
        src_frame.columnconfigure(0, weight=1)
        src_frame.rowconfigure(0, weight=1)

        list_frame = ttk.Frame(src_frame)
        list_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.source_listbox = tk.Listbox(list_frame, height=4, selectmode=tk.EXTENDED)
        self.source_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 4))
        scroll = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.source_listbox.yview)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.source_listbox.config(yscrollcommand=scroll.set)

        btn_frame = ttk.Frame(src_frame)
        btn_frame.pack(side=tk.LEFT, fill=tk.Y)
        ttk.Button(btn_frame, text="Add...", command=self._add_source).pack(pady=(0, 4))
        ttk.Button(btn_frame, text="Remove", command=self._remove_source).pack(pady=(0, 4))
        self._refresh_source_listbox()

        # Output mode
        ttk.Label(main, text="Output:").grid(row=2, column=0, sticky=tk.W, pady=(8, 4))
        mode_frame = ttk.Frame(main)
        mode_frame.grid(row=3, column=0, columnspan=2, sticky=tk.W, pady=(0, 4))
        ttk.Radiobutton(mode_frame, text="Save to folder", variable=self.mode_var, value="folder", command=self._on_mode_change).pack(side=tk.LEFT, padx=(0, 16))
        ttk.Radiobutton(mode_frame, text="Copy directly to CGP", variable=self.mode_var, value="cgp", command=self._on_mode_change).pack(side=tk.LEFT)

        ttk.Checkbutton(main, text="Skip files that already exist in CGP", variable=self.skip_existing_var).grid(row=4, column=0, columnspan=2, sticky=tk.W, pady=(0, 4))

        # Output folder (when mode = folder)
        ttk.Label(main, text="Output Folder:").grid(row=5, column=0, sticky=tk.W, pady=(4, 4))
        out_frame = ttk.Frame(main)
        out_frame.grid(row=6, column=0, columnspan=2, sticky=tk.EW, pady=(0, 4))
        self.output_entry = ttk.Entry(out_frame, textvariable=self.output_var, width=50)
        self.output_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))
        ttk.Button(out_frame, text="Browse...", command=self._browse_output).pack(side=tk.LEFT)

        # CGP path (when mode = cgp)
        ttk.Label(main, text="CGP Install Path:").grid(row=7, column=0, sticky=tk.W, pady=(4, 4))
        cgp_frame = ttk.Frame(main)
        cgp_frame.grid(row=8, column=0, columnspan=2, sticky=tk.EW, pady=(0, 8))
        self.cgp_entry = ttk.Entry(cgp_frame, textvariable=self.cgp_var, width=50)
        self.cgp_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4))
        ttk.Button(cgp_frame, text="Browse...", command=self._browse_cgp).pack(side=tk.LEFT)

        self._on_mode_change()

        # Convert / Preview buttons
        btn_frame = ttk.Frame(main)
        btn_frame.grid(row=9, column=0, columnspan=2, pady=(12, 8))
        self.convert_btn = ttk.Button(btn_frame, text="Convert", command=lambda: self._convert(dry_run=False))
        self.convert_btn.pack(side=tk.LEFT, padx=(0, 8))
        self.preview_btn = ttk.Button(btn_frame, text="Preview", command=lambda: self._convert(dry_run=True))
        self.preview_btn.pack(side=tk.LEFT)

        # Status
        ttk.Label(main, text="Status:").grid(row=10, column=0, sticky=tk.NW, pady=(8, 4))
        self.status_text = tk.Text(main, height=10, width=60, wrap=tk.WORD, state=tk.DISABLED)
        self.status_text.grid(row=11, column=0, columnspan=2, sticky=tk.NSEW, pady=(0, 0))
        main.rowconfigure(11, weight=1)

        self._log("Ready. Add LPC source folder(s) and click Convert or Preview.")

    def _on_mode_change(self) -> None:
        mode = self.mode_var.get()
        self.output_entry.config(state=tk.NORMAL if mode == "folder" else tk.DISABLED)
        self.cgp_entry.config(state=tk.NORMAL if mode == "cgp" else tk.DISABLED)

    def _refresh_source_listbox(self) -> None:
        self.source_listbox.delete(0, tk.END)
        for p in self.source_list:
            self.source_listbox.insert(tk.END, p)

    def _add_source(self) -> None:
        path = filedialog.askdirectory(title="Select LPC Source Folder")
        if path and path not in self.source_list:
            self.source_list.append(path)
            self._refresh_source_listbox()

    def _remove_source(self) -> None:
        sel = list(self.source_listbox.curselection())
        for i in reversed(sel):
            if 0 <= i < len(self.source_list):
                del self.source_list[i]
        self._refresh_source_listbox()

    def _browse_output(self) -> None:
        path = filedialog.askdirectory(title="Select Output Folder")
        if path:
            self.output_var.set(path)

    def _browse_cgp(self) -> None:
        path = filedialog.askdirectory(title="Select Character Generator Plus Install Folder")
        if path:
            self.cgp_var.set(path)

    def _log(self, msg: str) -> None:
        self.status_text.config(state=tk.NORMAL)
        self.status_text.insert(tk.END, msg + "\n")
        self.status_text.see(tk.END)
        self.status_text.config(state=tk.DISABLED)

    def _clear_log(self) -> None:
        self.status_text.config(state=tk.NORMAL)
        self.status_text.delete(1.0, tk.END)
        self.status_text.config(state=tk.DISABLED)

    def _convert(self, dry_run: bool = False) -> None:
        sources = [Path(p.strip()) for p in self.source_list if p.strip()]
        valid_sources = [s for s in sources if s.exists()]
        if not valid_sources:
            messagebox.showerror("Error", "Please add at least one valid LPC source folder.")
            return

        if run_conversion is None:
            messagebox.showerror("Error", "Conversion module not found. Run from the lpc_converter folder.")
            return

        mode = self.mode_var.get()
        output_path = Path(self.output_var.get().strip()) if mode == "folder" else Path(SCRIPT_DIR) / "_temp_cgp_output"
        cgp_path = Path(self.cgp_var.get().strip()) if mode == "cgp" else None

        if mode == "cgp" and not dry_run:
            if not cgp_path or not cgp_path.exists():
                messagebox.showerror("Error", "Please select a valid Character Generator Plus install folder.")
                return
            output_path = Path(SCRIPT_DIR) / "_temp_cgp_output"

        self._clear_log()
        self.convert_btn.config(state=tk.DISABLED)
        self.preview_btn.config(state=tk.DISABLED)
        self.root.update()

        try:
            if dry_run:
                self._log("Preview (dry run)...")
            else:
                self._log("Converting...")

            total_copied, total_skipped = 0, 0
            for i, source in enumerate(valid_sources):
                if len(valid_sources) > 1:
                    self._log(f"Source {i + 1}/{len(valid_sources)}: {source}")
                copied, skipped = run_conversion(source, output_path, CONFIG_PATH, dry_run=dry_run)
                total_copied += copied
                total_skipped += skipped
                if len(valid_sources) > 1:
                    self._log(f"  -> Copied: {copied}, Skipped: {skipped}")

            self._log(f"Done. Total copied: {total_copied}, Skipped: {total_skipped}")

            if mode == "cgp" and cgp_path and not dry_run:
                self._log("Copying to CGP...")
                cgp_lpc = cgp_path / "dlc" / "lpc"
                cgp_lpc.mkdir(parents=True, exist_ok=True)
                src_lpc = output_path / "dlc" / "lpc"
                merge_count = 0
                skipped_count = 0
                skip_existing = self.skip_existing_var.get()
                for sub in ["Face", "SV", "TV", "TVD", "Variation"]:
                    src_sub_dir = src_lpc / sub
                    if not src_sub_dir.exists():
                        continue
                    for gender in ["female", "male", "teen"]:
                        src_sub = src_sub_dir / gender
                        dst_sub = cgp_lpc / sub / gender
                        if src_sub.exists():
                            dst_sub.mkdir(parents=True, exist_ok=True)
                            for f in src_sub.iterdir():
                                if f.is_file():
                                    dst_file = dst_sub / f.name
                                    if skip_existing and dst_file.exists():
                                        skipped_count += 1
                                        continue
                                    shutil.copy2(f, dst_file)
                                    merge_count += 1
                self._log(f"Copied {merge_count} files to CGP." + (f" Skipped {skipped_count} existing." if skipped_count else ""))
                # Clean temp
                if output_path.exists():
                    shutil.rmtree(output_path, ignore_errors=True)

            if dry_run:
                messagebox.showinfo("Preview", f"Would process {total_copied} files from {len(valid_sources)} folder(s).")
            else:
                messagebox.showinfo("Success", f"Conversion complete. {total_copied} files processed.")
        except FileNotFoundError as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
        finally:
            self.convert_btn.config(state=tk.NORMAL)
            self.preview_btn.config(state=tk.NORMAL)

        # Persist settings
        self.settings["source_folders"] = self.source_list
        self.settings["output_folder"] = self.output_var.get()
        self.settings["cgp_path"] = self.cgp_var.get()
        self.settings["output_mode"] = self.mode_var.get()
        self.settings["skip_existing"] = self.skip_existing_var.get()
        save_settings(self.settings)

    def run(self) -> None:
        self.root.mainloop()


def main() -> None:
    app = LPCToCGPApp()
    app.run()


if __name__ == "__main__":
    main()
