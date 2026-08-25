#!/usr/bin/env python3
"""Extract product metadata and embedded photos from RAMBER Catalog 2."""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

import fitz


def title(value: str) -> str:
    return " ".join(value.strip().lower().split()).title()


def page_colors(page: str) -> list[str]:
    colors: list[str] = []
    for line in page.splitlines():
        if "Color:" not in line:
            continue
        for part in line.split("Color:")[1:]:
            cleaned = re.split(r"\s{3,}", part.strip())[0].strip()
            if cleaned:
                colors.append(title(cleaned))
    return colors


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: extract_catalog_2.py <catalog.pdf>")

    pdf = Path(sys.argv[1]).resolve()
    project = Path(__file__).resolve().parents[1]
    work = project / ".catalog-2-extract"
    images_out = project / "public" / "images" / "catalogo-2"
    data_out = project / "app" / "catalog-products-2.ts"
    text_file = work / "catalog.txt"

    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    if images_out.exists():
        shutil.rmtree(images_out)
    images_out.mkdir(parents=True)

    import subprocess
    subprocess.run(("pdftotext", "-layout", str(pdf), str(text_file)), check=True)
    pages = text_file.read_text(encoding="utf-8").split("\f")
    document = fitz.open(pdf)
    current_family = ""
    records: list[dict[str, str]] = []

    for page_number, page in enumerate(pages, start=1):
        codes = re.findall(r"Código:\s*(\d+)", page)
        if not codes:
            headers = [
                match.group(1)
                for line in page.splitlines()
                if (match := re.fullmatch(r"\s*([A-ZÁÉÍÓÚÑ]+(?:\s+[A-ZÁÉÍÓÚÑ]+)*)\s+\d+\s*", line))
            ]
            if headers:
                current_family = title(headers[0])
            continue
        if page_number == 1:
            continue
        if not current_family:
            raise ValueError(f"Missing collection name before page {page_number}")

        colors = page_colors(page)
        if len(colors) != len(codes):
            raise ValueError(f"Page {page_number}: {len(codes)} codes but {len(colors)} colors")

        lengths = re.findall(r"Largo\s+([0-9.]+)\s*cm", page, flags=re.I)
        widths = re.findall(r"Ancho\s+([0-9.]+)\s*cm", page, flags=re.I)
        heights = re.findall(r"Alto\s+([0-9.]+)\s*cm", page, flags=re.I)
        measurements = f"Largo {lengths[0]} cm Ancho {widths[0]} cm Alto {heights[0]} cm" if lengths and widths and heights else ""

        image_info = [item for item in document[page_number - 1].get_image_info(xrefs=True) if item["xref"]]
        # PDF object order is not visual order. Sort by the actual row and column
        # occupied by each photo so codes/colors stay paired with the right bag.
        image_info.sort(key=lambda item: (int(item["bbox"][1] // 100), item["bbox"][0]))
        if len(image_info) != len(codes):
            raise ValueError(f"Page {page_number}: expected {len(codes)} images, found {len(image_info)} positioned images")

        feature_lines = []
        for feature in ("Un compartimento", "Bolsa interior", "Bolsa exterior", "Doble asa", "Una asa", "Monedero extra", "Doble cierre"):
            if feature.lower() in page.lower():
                feature_lines.append(feature)
        features = " · ".join(feature_lines)

        color_fixes = {
            "4421": "Cartera Cereza Negra",
            "4422": "Neceser Cereza Negra",
        }
        for code, color, image in zip(codes, colors, image_info):
            extracted = document.extract_image(image["xref"])
            extension = extracted.get("ext", "jpg").lower()
            filename = f"modelo-{code}.{extension}"
            (images_out / filename).write_bytes(extracted["image"])
            records.append({
                "code": code,
                "family": current_family,
                "color": color_fixes.get(code, color),
                "measurements": measurements,
                "features": features,
                "image": f"/images/catalogo-2/{filename}",
                "catalog": "2",
            })

    if len(records) != 172:
        raise ValueError(f"Expected 172 Catalog 2 products, found {len(records)}")

    payload = json.dumps(records, ensure_ascii=False, indent=2)
    data_out.write_text(
        'import type { CatalogProduct } from "./catalog-products";\n\n'
        f"export const catalogProducts2: CatalogProduct[] = {payload};\n",
        encoding="utf-8",
    )
    shutil.rmtree(work)
    print(json.dumps({"products": len(records), "families": len(set(item["family"] for item in records))}, ensure_ascii=False))


if __name__ == "__main__":
    main()
