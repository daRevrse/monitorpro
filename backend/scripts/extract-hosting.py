# -*- coding: utf-8 -*-
# Extrait le classeur Excel "HOSTING ET SITES WEB" en JSON :
# [{ "account": <nom feuille>, "sites": [{ "name", "url", "etat" }] }]
import openpyxl, json, sys

SRC = r"C:\Users\Administrateur\Documents\HOSTING  ET SITES WEB  _24- 08-2023 (Enregistré automatiquement).xlsx"
EXCLUDE = {"RAPPORT", "Feuil11"}

wb = openpyxl.load_workbook(SRC, data_only=True)
result = []

for ws in wb.worksheets:
    if ws.title in EXCLUDE:
        continue
    rows = list(ws.iter_rows(values_only=True))
    # Trouver la ligne d'en-tête (celle qui contient 'URL')
    header_idx = None
    col_nom = col_url = col_etat = None
    for i, row in enumerate(rows):
        cells = [(str(c).strip().upper() if c is not None else "") for c in row]
        if "URL" in cells:
            header_idx = i
            col_url = cells.index("URL")
            col_nom = cells.index("NOM") if "NOM" in cells else max(0, col_url - 1)
            col_etat = cells.index("ETATS") if "ETATS" in cells else (
                cells.index("ETAT") if "ETAT" in cells else col_url + 1
            )
            break
    if header_idx is None:
        continue

    sites = []
    for row in rows[header_idx + 1:]:
        def get(idx):
            if idx is None or idx >= len(row):
                return ""
            v = row[idx]
            return str(v).strip() if v is not None else ""
        url = get(col_url)
        name = get(col_nom)
        etat = get(col_etat)
        if not url and not name:
            continue
        if not url:  # pas d'URL exploitable
            continue
        sites.append({"name": name or url, "url": url, "etat": etat})

    result.append({"account": ws.title.strip(), "sites": sites})

out = sys.argv[1] if len(sys.argv) > 1 else "hosting-import.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

total_sites = sum(len(a["sites"]) for a in result)
print(f"Comptes: {len(result)} | Sites: {total_sites} -> {out}")
