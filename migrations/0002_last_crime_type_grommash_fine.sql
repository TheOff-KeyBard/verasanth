-- Characters: last crime label for Grommash fine flavor; fine cooldown timestamp (ms).
ALTER TABLE characters ADD COLUMN last_crime_type TEXT DEFAULT NULL;
ALTER TABLE characters ADD COLUMN grommash_fine_last INTEGER DEFAULT NULL;
