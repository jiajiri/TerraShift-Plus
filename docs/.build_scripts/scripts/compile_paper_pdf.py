#!/usr/bin/env python3
"""
Compile docs/research-paper/research-paper.html to frontend/public/research-paper.pdf
with headless Chromium and inject clickable hierarchical document outline bookmarks
using pypdf.
"""

import os
import subprocess
import sys
import tempfile
from pathlib import Path
from pypdf import PdfReader, PdfWriter

REPO_ROOT = Path(__file__).resolve().parent.parent
HTML_PATH = REPO_ROOT / "docs" / "research-paper" / "research-paper.html"
OUTPUT_PDF = REPO_ROOT / "frontend" / "public" / "research-paper.pdf"

# Hierarchical outline mapping: (title, page_0_indexed, list of (sub_title, sub_page_0_indexed))
OUTLINE_STRUCTURE = [
    ("Title & Abstract", 0, []),
    (
        "1 Introduction",
        0,
        [
            ("1.1 Background", 0),
            ("1.2 Closed-Loop System Overview", 1),
            ("1.3 Core Research Objectives", 1),
        ],
    ),
    (
        "2 Methods",
        2,
        [
            ("2.1 Multi-Mission Ingestion", 2),
            ("2.2 Physics-Informed Agronomic Engine", 3),
            ("2.3 ML Surrogate & Invariance", 5),
            ("2.4 Stochastic Pareto Optimizer", 6),
        ],
    ),
    (
        "3 Results",
        7,
        [
            ("3.1 Spatial CV", 7),
            ("3.2 Multi-Zone Empirical Validation", 8),
            ("3.3 Real-Time SSE Latency", 9),
        ],
    ),
    (
        "4 Discussion",
        10,
        [
            ("4.1 Scientific Significance", 10),
            ("4.2 Alternative Paradigms Comparison", 10),
            ("4.3 Limitations & Gaps", 11),
        ],
    ),
    ("5 Conclusions", 11, []),
    ("6 AI / Super Intelligence (SI) Disclosure", 11, []),
    ("Acknowledgments", 12, []),
    ("References", 12, []),
    ("Appendix A: Data Availability & API Endpoints", 13, []),
    ("Appendix B: Hardware & Execution Profile", 13, []),
    ("Appendix C: Open-Source Software Dependencies", 13, []),
    ("Appendix D: Numerical Reproducibility Checklist", 13, []),
]


def render_pdf_with_chromium(html_path: Path, raw_pdf_path: Path):
    """Render HTML to PDF using Chromium in headless mode."""
    profile_dir = tempfile.mkdtemp(prefix="chromium-profile-")
    cmd = [
        "chromium-browser",
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        f"--user-data-dir={profile_dir}",
        f"--print-to-pdf={raw_pdf_path}",
        html_path.resolve().as_uri(),
    ]
    print(f"Running command: {' '.join(cmd)}")
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        proc.wait(timeout=12)
    except subprocess.TimeoutExpired:
        print("Chromium print-to-pdf finished writing, terminating headless process...")
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except subprocess.TimeoutExpired:
            proc.kill()

    if not raw_pdf_path.exists() or raw_pdf_path.stat().st_size == 0:
        raise RuntimeError("Chromium failed to generate PDF output.")
    print(f"Raw PDF successfully generated: {raw_pdf_path.stat().st_size} bytes")


def inject_bookmarks(raw_pdf_path: Path, output_pdf_path: Path):
    """Inject hierarchical outline bookmarks into PDF using pypdf."""
    reader = PdfReader(raw_pdf_path)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    num_pages = len(writer.pages)
    print(f"Total pages in PDF: {num_pages}")

    for item in OUTLINE_STRUCTURE:
        title, page_num, children = item
        if page_num >= num_pages:
            page_num = num_pages - 1
        parent_bm = writer.add_outline_item(title=title, page_number=page_num)

        for child_title, child_page in children:
            if child_page >= num_pages:
                child_page = num_pages - 1
            writer.add_outline_item(
                title=child_title,
                page_number=child_page,
                parent=parent_bm,
            )

    output_pdf_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_pdf_path, "wb") as f_out:
        writer.write(f_out)
    print(f"Bookmark-injected PDF saved to: {output_pdf_path}")


def verify_pdf(pdf_path: Path):
    """Verify bookmarks, page count, and absence of raw LaTeX math strings."""
    reader = PdfReader(pdf_path)
    print(f"Verification: {len(reader.pages)} pages detected.")
    assert len(reader.pages) == 14, f"Expected 14 pages, got {len(reader.pages)}"

    outline = reader.outline
    assert outline, "No outline/bookmarks found in PDF!"
    print(f"Verification: Outline bookmarks present (top-level count: {len(outline)}).")

    full_text = ""
    for idx, page in enumerate(reader.pages):
        full_text += page.extract_text() or ""

    # Check for raw math formulas
    assert "\\frac" not in full_text, "Found raw \\frac token in rendered PDF text!"
    print("Verification: Zero raw \\frac tokens in PDF text.")

    # Check for Fallon
    assert "Fallon" in full_text, "Fallon, Nevada missing from PDF text!"
    print("Verification: Fallon, Nevada present in Table 3 / text.")


def main():
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_pdf:
        tmp_pdf_path = Path(tmp_pdf.name)

    try:
        render_pdf_with_chromium(HTML_PATH, tmp_pdf_path)
        inject_bookmarks(tmp_pdf_path, OUTPUT_PDF)
        verify_pdf(OUTPUT_PDF)
        print("Paper PDF compilation and verification successful!")
    finally:
        if tmp_pdf_path.exists():
            tmp_pdf_path.unlink()


if __name__ == "__main__":
    main()
