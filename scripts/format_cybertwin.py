import os
import sys
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls
import win32com.client
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

def set_cell_margins(cell, top=50, bottom=50, left=80, right=80):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex="F2F2F2"):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_clean_three_line_borders(table):
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="10" w:space="0" w:color="000000"/>
            <w:bottom w:val="single" w:sz="10" w:space="0" w:color="000000"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideH w:val="none"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(tblBorders)

def add_header_bottom_border(cell):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>
        </w:tcBorders>
    ''')
    tcPr.append(tcBorders)

def set_table_borders(table, border_color="C0C0C0"):
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>
            <w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(tblBorders)

def clear_all_headers(doc):
    for sec in doc.sections:
        sec.different_first_page_header_footer = False
        hdr = sec.header
        hdr.is_linked_to_previous = False
        for p in list(hdr.paragraphs):
            pPr = p._p.pPr
            p._p.clear()
            if pPr is not None:
                p._p.append(pPr)
        
        first_hdr = sec.first_page_header
        first_hdr.is_linked_to_previous = False
        for p in list(first_hdr.paragraphs):
            pPr = p._p.pPr
            p._p.clear()
            if pPr is not None:
                p._p.append(pPr)

print("Starting complete CyberTwin transformation...")

doc = docx.Document('docs/Memora_Report_Rewritten-1.docx')

# 1. Clear all headers completely
clear_all_headers(doc)

# 2. Margins matching CyberTwin (left 84pt / 1.17in, right 68pt / 0.95in, top/bottom 72pt / 1.0in)
for sec in doc.sections:
    sec.top_margin = Inches(1.0)
    sec.bottom_margin = Inches(1.0)
    sec.left_margin = Inches(1.17)
    sec.right_margin = Inches(0.95)
    sec.header_distance = Inches(0.5)
    sec.footer_distance = Inches(0.5)

# Set base style properties
for s_name in ['Normal', 'Heading 1', 'Heading 2', 'Heading 3', 'Heading 4']:
    if s_name in doc.styles:
        st = doc.styles[s_name]
        st.font.name = 'Times New Roman'
        if s_name == 'Normal':
            st.font.size = Pt(12)
            st.font.color.rgb = RGBColor(0, 0, 0)
            st.paragraph_format.line_spacing = 1.15
            st.paragraph_format.space_after = Pt(5)
            st.paragraph_format.space_before = Pt(0)
            st.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

print("Configured margins and styles.")

# 3. Format all headings and paragraphs
prelim_titles = [
    "DECLARATION", "CERTIFICATE", "ACKNOWLEDGEMENTS", "TABLE OF CONTENTS",
    "LIST OF FIGURES", "LIST OF TABLES", "LIST OF ABBREVIATIONS",
    "SYMBOLS AND NOTATIONS", "ABSTRACT"
]

for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if not txt:
        continue

    # Preliminary Headings: Centered, 15pt Bold, Times New Roman
    if txt in prelim_titles:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(16)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(15)
            r.bold = True
        continue

    # CHAPTER X: Centered, 16pt Bold, Times New Roman
    if txt.startswith("CHAPTER "):
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(12)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(16)
            r.bold = True
        continue

    # Main Chapter Title (e.g. 1. INTRODUCTION, 2. PROJECT DESCRIPTION AND GOALS)
    if p.style.name == 'Heading 1' and txt not in prelim_titles:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(14)
            r.bold = True
        continue

    # Section Heading (Heading 2: 14pt Bold, Left)
    if p.style.name == 'Heading 2':
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(14)
            r.bold = True
        continue

    # Subsection Heading (Heading 3: 12pt Bold, Left)
    if p.style.name == 'Heading 3':
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(12)
            r.bold = True
        continue

    # Heading 4 (Algorithms, Research Questions: 12pt Bold Italic)
    if p.style.name == 'Heading 4' or txt.startswith("Algorithm ") or (txt.startswith("RQ") and ":" in txt):
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(12)
            r.bold = True
        continue

    # Captions
    if txt.startswith("Figure "):
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(12)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
        continue

    if txt.startswith("Table ") and (":" in txt or "\t" in txt) and len(txt) < 130:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            r.bold = True
        continue

    # References
    if re.match(r'^\[\d+\]', txt):
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Inches(0.35)
        p.paragraph_format.first_line_indent = Inches(-0.35)
        p.paragraph_format.space_after = Pt(4)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
        continue

    # Regular body paragraphs
    if p.style.name == 'Normal' and i > 25:
        if p._p.xpath('.//a:blip'):
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(4)
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(5)
            p.paragraph_format.space_before = Pt(0)
            for r in p.runs:
                if r.font.name != 'Consolas':
                    r.font.name = 'Times New Roman'
                    if not r.font.size:
                        r.font.size = Pt(12)

# 4. Format all data tables with clean borders and padding
for t_idx, tbl in enumerate(doc.tables):
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    if t_idx in [0, 1, 2]:
        for row in tbl.rows:
            for c in row.cells:
                set_cell_margins(c, top=40, bottom=40, left=60, right=60)
                for cp in c.paragraphs:
                    for cr in cp.runs:
                        cr.font.name = 'Times New Roman'
        continue

    set_table_borders(tbl, "C0C0C0")
    for r_idx, row in enumerate(tbl.rows):
        is_header = (r_idx == 0)
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        if is_header:
            trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

        for c in row.cells:
            set_cell_margins(c, top=45, bottom=45, left=75, right=75)
            if is_header:
                set_cell_shading(c, "F0F0F0")
                add_header_bottom_border(c)
            
            for cp in c.paragraphs:
                cp.paragraph_format.space_before = Pt(0)
                cp.paragraph_format.space_after = Pt(1)
                cp.paragraph_format.line_spacing = 1.05
                for cr in cp.runs:
                    cr.font.name = 'Times New Roman'
                    if is_header:
                        cr.bold = True
                        cr.font.size = Pt(10)
                    else:
                        if not cr.font.size or cr.font.size.pt > 10.5:
                            cr.font.size = Pt(9.5)

out_docx = os.path.abspath('docs/Memora_Project_Report_CyberTwin_Format.docx')
doc.save(out_docx)
print(f"Saved initial formatted docx: {out_docx}")

# 5. Export to PDF with Word COM
word = win32com.client.Dispatch('Word.Application')
word.Visible = False
out_pdf = os.path.abspath('docs/Memora_Project_Report_CyberTwin_Format.pdf')
wdoc = word.Documents.Open(out_docx)
wdoc.SaveAs(out_pdf, FileFormat=17) # wdFormatPDF
wdoc.Close()
word.Quit()
print(f"Saved initial PDF: {out_pdf}")

# 6. Verify page numbers and headers in PDF
pdf = pymupdf.open(out_pdf)
print(f"Total pages in PDF: {len(pdf)}")

headers_detected = []
for pno in range(len(pdf)):
    page = pdf[pno]
    blocks = page.get_text('dict')['blocks']
    for b in blocks:
        if 'lines' in b:
            for l in b['lines']:
                for s in l['spans']:
                    if s['bbox'][1] < 60 and s['text'].strip():
                        headers_detected.append((pno+1, s['text']))

print(f"Headers detected in top 60pt across {len(pdf)} pages: {headers_detected}")
