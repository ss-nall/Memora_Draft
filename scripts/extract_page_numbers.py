import sys
import re
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')
pdf = pymupdf.open('docs/Memora_Project_Report_CyberTwin_Format.pdf')
print(f"Total pages: {len(pdf)}")

# Map headings, figures, tables to page numbers
headings_map = {}
figures_map = {}
tables_map = {}

for pno in range(len(pdf)):
    page = pdf[pno]
    text = page.get_text()
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    # Check for footer page number
    # bottom items
    blocks = page.get_text('dict')['blocks']
    page_num_str = ""
    for b in blocks:
        if 'lines' in b:
            for l in b['lines']:
                for s in l['spans']:
                    if s['bbox'][1] > 740 and s['text'].strip():
                        page_num_str = s['text'].strip()
    
    for l in lines:
        # Check chapter & sections
        if l.startswith("CHAPTER ") or any(l.startswith(f"{c}. ") or l.startswith(f"{c}.1") for c in range(1, 10)) or l in [
            "ABSTRACT", "DECLARATION", "CERTIFICATE", "ACKNOWLEDGEMENTS", "TABLE OF CONTENTS",
            "LIST OF FIGURES", "LIST OF TABLES", "LIST OF ABBREVIATIONS", "SYMBOLS AND NOTATIONS",
            "REFERENCES", "APPENDIX A"
        ]:
            if l not in headings_map:
                headings_map[l] = (pno + 1, page_num_str)
        
        # Check figures
        m_fig = re.match(r'^(Figure\s+\d+\.\d+[:\.]?\s*[^.]+)', l)
        if m_fig and not "LIST OF FIGURES" in text and pno > 10:
            fig_key = m_fig.group(1).strip()
            if fig_key not in figures_map:
                figures_map[fig_key] = (pno + 1, page_num_str)
                
        # Check tables
        m_tbl = re.match(r'^(Table\s+\d+\.\d+[:\.]?\s*[^.]+)', l)
        if m_tbl and not "LIST OF TABLES" in text and pno > 10:
            tbl_key = m_tbl.group(1).strip()
            if tbl_key not in tables_map:
                tables_map[tbl_key] = (pno + 1, page_num_str)

print("\n--- DETECTED HEADINGS WITH PAGE NUMBERS ---")
for k, v in headings_map.items():
    print(f"  {k[:45]:45s} -> PDF Page {v[0]:2d} (Printed: '{v[1]}')")

print("\n--- DETECTED FIGURES WITH PAGE NUMBERS ---")
for k, v in figures_map.items():
    print(f"  {k[:45]:45s} -> PDF Page {v[0]:2d} (Printed: '{v[1]}')")

print("\n--- DETECTED TABLES WITH PAGE NUMBERS ---")
for k, v in tables_map.items():
    print(f"  {k[:45]:45s} -> PDF Page {v[0]:2d} (Printed: '{v[1]}')")
