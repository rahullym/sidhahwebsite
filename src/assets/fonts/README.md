# Fonts

`Inter-Regular.subset.ttf` and `Inter-Bold.subset.ttf` are embedded into generated invoice
PDFs by `src/lib/server/pdf.ts`. They are **not** used by the website, which loads Inter from
Google Fonts like every other page.

Inter is licensed under the SIL Open Font License 1.1 (https://github.com/rsms/inter), which
permits redistribution of subsets. These are cut down to Latin-1 plus the rupee sign — 18 KB a
weight instead of 320 KB — with:

```
pyftsubset Inter-Regular.ttf \
  --output-file=Inter-Regular.subset.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+20B9,U+2122,U+2212" \
  --layout-features='' --no-hinting --desubroutinize --drop-tables+=DSIG
```

The subset defines what an invoice can print. `printable()` in `src/lib/format.ts` mirrors these
ranges, and the invoice form rejects anything outside them rather than emitting empty boxes — so
widening the subset means widening that regex too.
