#!/usr/bin/env python3
"""Create a Jekyll post from workflow inputs or a Google Doc export."""

from __future__ import annotations

import os
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value)
    return value.strip("-") or "post"


def extract_google_doc_assets(url: str, slug: str, date_slug: str) -> str:
    parsed = urllib.parse.urlparse(url)
    match = re.search(r"/document/d/([a-zA-Z0-9_-]+)", parsed.path)
    if not match:
        raise ValueError("Could not extract Google Doc id from URL.")

    doc_id = match.group(1)
    export_url = f"https://docs.google.com/document/d/{doc_id}/export?format=zip"
    with urllib.request.urlopen(export_url, timeout=30) as response:
        payload = response.read()

    zip_data = zipfile.ZipFile(BytesIO(payload))
    html_files = [name for name in zip_data.namelist() if name.endswith(".html")]
    if not html_files:
        raise ValueError("Google Doc export did not include an HTML file.")

    html_name = html_files[0]
    html = zip_data.read(html_name).decode("utf-8")

    body_match = re.search(r"<body[^>]*>(.*?)</body>", html, flags=re.DOTALL | re.IGNORECASE)
    body_html = body_match.group(1) if body_match else html

    image_dir = Path("images") / "blog" / f"{date_slug}-{slug}"
    image_dir.mkdir(parents=True, exist_ok=True)

    for name in zip_data.namelist():
        if name.endswith("/") or name == html_name:
            continue
        original = Path(name).name
        if not re.search(r"\.(png|jpg|jpeg|gif|webp|svg)$", original, flags=re.IGNORECASE):
            continue

        target = image_dir / original
        target.write_bytes(zip_data.read(name))

        body_html = body_html.replace(name, f"/images/blog/{date_slug}-{slug}/{original}")
        body_html = body_html.replace(original, f"/images/blog/{date_slug}-{slug}/{original}")

    cleaned = re.sub(r"\n{3,}", "\n\n", body_html).strip()
    if not cleaned:
        raise ValueError("Google Doc export returned empty content.")
    return cleaned


def parse_date(value: str) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    cleaned = value.strip().replace("Z", "+00:00")
    return datetime.fromisoformat(cleaned)


def main() -> int:
    title = os.getenv("POST_TITLE", "").strip()
    if not title:
        raise ValueError("POST_TITLE is required.")

    slug = slugify(os.getenv("POST_SLUG", "").strip() or title)
    tags_raw = os.getenv("POST_TAGS", "").strip()
    date_value = parse_date(os.getenv("POST_DATE", "").strip())
    content = os.getenv("POST_CONTENT", "").strip()
    doc_url = os.getenv("GOOGLE_DOC_URL", "").strip()
    date_slug = date_value.strftime("%Y-%m-%d")

    if doc_url:
        content = extract_google_doc_assets(doc_url, slug, date_slug)

    if not content:
        content = "Write your post here."

    tag_list = [tag.strip() for tag in tags_raw.split(",") if tag.strip()]
    tags_yaml = "\n".join([f"  - {tag}" for tag in tag_list]) or "  - update"

    file_path = Path("_posts") / f"{date_slug}-{slug}.md"
    permalink = f"/posts/{date_value.strftime('%Y/%m')}/{slug}/"

    body = (
        "---\n"
        f'title: "{title}"\n'
        f"date: {date_value.isoformat()}\n"
        f"permalink: {permalink}\n"
        "tags:\n"
        f"{tags_yaml}\n"
        "---\n\n"
        f"{content.rstrip()}\n"
    )

    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(body, encoding="utf-8")
    print(f"Wrote {file_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)
