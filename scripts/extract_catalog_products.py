#!/usr/bin/env python3
"""Extract the RAMBER catalog's embedded product photos and metadata."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: extract_catalog_products.py <catalog.pdf>")

    pdf = Path(sys.argv[1]).resolve()
    project = Path(__file__).resolve().parents[1]
    work = project / ".catalog-extract"
    images_out = project / "public" / "images" / "catalogo-1"
    data_out = project / "app" / "catalog-products.ts"
    text_file = work / "catalog.txt"
    raw_images = work / "images"

    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    raw_images.mkdir()
    images_out.mkdir(parents=True, exist_ok=True)

    run("pdftotext", "-layout", str(pdf), str(text_file))
    pages = text_file.read_text(encoding="utf-8").split("\f")
    product_pages: list[dict[str, object]] = []

    for page_number, page in enumerate(pages, start=1):
        if "MOD." not in page:
            continue
        header = next((line for line in page.splitlines() if "CATÁLOGO 2026" in line), "")
        family_match = re.search(r"CATÁLOGO 2026\s{2,}(.+?)\s*$", header)
        if not family_match:
            raise ValueError(f"Family not found on PDF page {page_number}")
        family = family_match.group(1).strip().title()
        detail_line = next((line.strip() for line in page.splitlines() if line.strip().startswith("Largo ")), "")
        measurements, _, features = detail_line.partition("|")

        variants: list[dict[str, str]] = []
        for line in page.splitlines():
            if "MOD." not in line:
                continue
            for segment in line.split("MOD.")[1:]:
                match = re.match(r"\s*(\d+)\s{2,}(.+?)\s*$", segment)
                if match:
                    variants.append({"code": match.group(1), "color": match.group(2).strip().title()})
        if len(variants) != 4:
            raise ValueError(f"Expected 4 products on PDF page {page_number}, found {len(variants)}")
        product_pages.append({
            "page": page_number,
            "family": family,
            "measurements": measurements.strip(),
            "features": features.strip(),
            "variants": variants,
        })

    run("pdfimages", "-f", "2", "-l", "48", "-j", str(pdf), str(raw_images / "product"))
    extracted = sorted(path for path in raw_images.iterdir() if path.is_file())
    products = [variant for page in product_pages for variant in page["variants"]]
    if len(extracted) != len(products):
        raise ValueError(f"Expected {len(products)} images, extracted {len(extracted)}")

    records: list[dict[str, str]] = []
    image_index = 0
    for page in product_pages:
        for variant in page["variants"]:
            source = extracted[image_index]
            suffix = source.suffix.lower() or ".jpg"
            filename = f"modelo-{variant['code']}{suffix}"
            shutil.copy2(source, images_out / filename)
            records.append({
                "code": variant["code"],
                "family": page["family"],
                "color": variant["color"],
                "measurements": page["measurements"],
                "features": page["features"],
                "image": f"/images/catalogo-1/{filename}",
            })
            image_index += 1

    payload = json.dumps(records, ensure_ascii=False, indent=2)
    data_out.write_text(
        "export type CatalogProduct = { code: string; family: string; color: string; measurements: string; features: string; image: string };\n\n"
        f"export const catalogProducts: CatalogProduct[] = {payload};\n",
        encoding="utf-8",
    )
    shutil.rmtree(work)
    print(json.dumps({"pages": len(product_pages), "products": len(records), "families": len(set(r["family"] for r in records))}))


if __name__ == "__main__":
    main()
