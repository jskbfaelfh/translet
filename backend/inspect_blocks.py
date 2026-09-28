import fitz

doc = fitz.open("../Lecture_Neural_Networks_5Pages.pdf")
page = doc[0]
d = page.get_text("dict")

print(f"Total blocks: {len(d['blocks'])}")
for b_idx, b in enumerate(d["blocks"]):
    if b.get("type") == 0:
        lines = []
        for line in b.get("lines", []):
            line_str = "".join([span.get("text", "") for span in line.get("spans", [])])
            lines.append(line_str)
        print(f"Block {b_idx} ({len(lines)} lines):")
        for l_idx, l in enumerate(lines):
            print(f"   Line {l_idx}: {l}")
