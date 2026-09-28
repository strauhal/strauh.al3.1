# Seeker image naming desk

A local successor to `seeker.html` and `seeker2.html`. Identified works retain
`Title by Artist (Year).ext`; unknown images receive a short literal description,
as in the original Seeker. No made-up artist is inserted when search fails.

Double-click `Open-Seeker.command` to reopen the loaded folder, or run with Python 3.10+ and Pillow (`python3 -m pip install Pillow` if needed):

```sh
python3 tools/seeker/app.py unnamed --state .seeker
```

Open http://127.0.0.1:8765 and enter connection details. API keys stay in process
memory; alternatively supply `GEMINI_API_KEY` and `VISION_API_KEY` environment
variables. Cloud Vision can use `GOOGLE_CLOUD_PROJECT` plus `gcloud auth login`.
Cloud Vision must be enabled and billing configured. An AI Studio key alone is
not a working Cloud Vision connection. Images go to Google only on processing.

Choose reverse search or explicitly choose descriptions only. Try five first.
Three workers process images concurrently. Every result is checkpointed in SQLite; restarting resumes pending work. Identical
files share cached results. Search/auth/quota failures pause rather than silently
falling back to ungrounded identification. Oversized images are resized and
converted to JPEG for the API; originals keep their exact bytes and extension.
PDFs and other non-image files are listed as excluded.

Full-image match page titles are supplied as evidence. Each metadata field must
have an exact supporting quote. Similar images and partial matches cannot supply
attributions. This reduces hallucinations but does not prove attribution: a web
page can contain multiple works, misleading metadata, or conflicting material.
Review the image and linked sources, edit a proposal if necessary, and approve it.
Export creates copies in `.seeker/named-.../`, resolves filename collisions, and
writes a provenance manifest; it never renames or deletes originals. The CSV plan
can be downloaded at any time. Keep `.seeker` to retain the queue and cache.

Tests: `python3 -m unittest discover -s tools/seeker -v`.
