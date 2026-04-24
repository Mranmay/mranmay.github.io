#!/usr/bin/env python3
"""Create a Jekyll post from workflow inputs or a Google Doc export."""

from __future__ import annotations

import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value)
    return value.strip("-") or "post"


def google_doc_text(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    match = re.search(r"/document/d/([a-zA-Z0-9_-]+)", parsed.path)
    if not match:
        raise ValueError("Could not extract Google Doc id from URL.")

    doc_id = match.group(1)
    export_url = f"https://docs.google.com/document/d/{doc_id}/export?format=txt"
    with urllib.request.urlopen(export_url, timeout=30) as response:
        text = response.read().decode("utf-8").strip()
    if not text:
        raise ValueError("Google Doc export returned empty content.")
    return text


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

    if doc_url:
        content = google_doc_text(doc_url)

    if not content:
        content = "Write your post here."

    tag_list = [tag.strip() for tag in tags_raw.split(",") if tag.strip()]
    tags_yaml = "\n".join([f"  - {tag}" for tag in tag_list]) or "  - update"

    date_slug = date_value.strftime("%Y-%m-%d")
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
