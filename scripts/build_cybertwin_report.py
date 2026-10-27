import os
import sys
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls
import win32com.client
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

print("=== REBUILDING WITH PURE BLACK HEADINGS ===")

def set_cell_margins(cell, top=50, bottom=50, left=80, right=80):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_three_line_borders(table):
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

# Master Data for TOC, Figures, and Tables
toc_items = [
    ("", "Abstract", "xi", False),
    ("1", "INTRODUCTION", "1", True),
    ("1.1", "Background", "1", False),
    ("1.2", "Motivations", "1", False),
    ("1.3", "Scope of the Project", "2", False),
    ("2", "PROJECT DESCRIPTION AND GOALS", "3", True),
    ("2.1", "Literature Review", "3", False),
    ("2.1.1", "Multi-Task Face Detection and Feature Alignment", "3", False),
    ("2.1.2", "Efficient Edge Face Localization and Tiling", "4", False),
    ("2.1.3", "Hyperspherical Loss Formulations and Embeddings", "4", False),
    ("2.1.4", "Deep Metric Learning and Illumination Invariance", "4", False),
    ("2.1.5", "High-Dimensional Approximate Nearest-Neighbor Vector Indexing", "4", False),
    ("2.2", "Research Gap", "5", False),
    ("2.3", "Objectives", "6", False),
    ("2.4", "Problem Statement", "6", False),
    ("2.5", "Project Plan", "7", False),
    ("3", "TECHNICAL SPECIFICATION", "8", True),
    ("3.1", "Requirements", "8", False),
    ("3.1.1", "Functional", "8", False),
    ("3.1.2", "Non-Functional", "8", False),
    ("3.2", "Feasibility Study", "9", False),
    ("3.2.1", "Technical Feasibility", "9", False),
    ("3.2.2", "Economic Feasibility", "9", False),
    ("3.2.3", "Social Feasibility", "9", False),
    ("3.3", "System Specification", "10", False),
    ("3.3.1", "Hardware Specification", "10", False),
    ("3.3.2", "Software Specification", "10", False),
    ("4", "DESIGN APPROACH AND DETAILS", "11", True),
    ("4.1", "System Architecture", "11", False),
    ("4.2", "Design", "13", False),
    ("4.2.1", "Data Flow Diagram", "13", False),
    ("4.2.2", "Use Case Diagram", "14", False),
    ("4.2.3", "Class Diagram", "14", False),
    ("4.2.4", "Sequence Diagram", "15", False),
    ("4.2.5", "Component and Interface Architecture", "16", False),
    ("5", "METHODOLOGY AND TESTING", "17", True),
    ("5.1", "Module Description", "17", False),
    ("5.1.1", "Ingestion and Tiling Engine", "17", False),
    ("5.1.2", "Preprocessing and CLAHE Normalization", "18", False),
    ("5.1.3", "SCRFD Deep Face Detection", "18", False),
    ("5.1.4", "ArcFace Embedding Extraction", "18", False),
    ("5.1.5", "FAISS Vector Similarity & Centroid Clustering", "19", False),
    ("5.1.6", "Automated Reel Synthesis & Procedural Audio", "20", False),
    ("5.2", "Experimental Methodology", "20", False),
    ("5.3", "Testing", "21", False),
    ("6", "PROJECT DEMONSTRATION", "22", True),
    ("6.1", "Web Dashboard & Organizer Management", "22", False),
    ("6.1.1", "Venue Signage QR Distribution & Worker Telemetry Monitor", "23", False),
    ("6.2", "Zero-Install Guest Onboarding & Biometric Scanner", "24", False),
    ("6.2.1", "Live Biometric Kiosk Scanner Station", "24", False),
    ("6.3", "Automated Photo Matching & Instant Personal Gallery", "25", False),
    ("6.3.1", "High-Throughput Batch Zip Archive Streaming Exporter", "26", False),
    ("6.4", "Automated Memory Reel Synthesis & Beat Pacing Lab", "27", False),
    ("6.4.1", "Real-Time Procedural Web Audio Synthesizer & Dynamic Filter Lab", "28", False),
    ("6.5", "Cross-Platform Mobile Deployment (Oppo Reno 11 5G)", "29", False),
    ("7", "RESULT AND DISCUSSION", "30", True),
    ("7.1", "Experimental Results", "30", False),
    ("7.1.1", "RQ1: Multi-Scale Tiling Face Detection Recall", "30", False),
    ("7.1.2", "RQ2: ArcFace Angular Margin Optimization", "31", False),
    ("7.1.3", "RQ3: CPU vs GPU Latency & Throughput Trade-offs", "31", False),
    ("7.1.4", "RQ4: FAISS Vector Scalability vs Brute-Force", "32", False),
    ("7.1.5", "RQ5: Multi-Angle Centroid Verification Robustness", "32", False),
    ("7.1.6", "RQ6: Dynamic Beat-Synchronization Precision", "33", False),
    ("7.1.7", "RQ7: Celery/Redis Fault Tolerance & Thread Fallback", "33", False),
    ("7.2", "Discussion", "34", False),
    ("7.3", "Cost Analysis", "35", False),
    ("8", "CONCLUSION", "37", True),
    ("8.1", "Summary of Contributions", "37", False),
    ("8.2", "Societal and Ethical Impact", "37", False),
    ("8.3", "Limitations and Future Research Directions", "37", False),
    ("9", "REFERENCES", "39", True),
    ("", "APPENDIX A – SAMPLE CODE IMPLEMENTATION", "43", True)
]

figures_master = [
    ("2.1", "Project Timeline and Engineering Work Breakdown (Gantt Chart)", "7"),
    ("4.1", "System Architecture of Memora 4-Tier Platform", "11"),
    ("4.2", "Level-0 Context Data Flow Diagram (DFD)", "12"),
    ("4.3", "Level-1 Functional Decomposition Data Flow Diagram (DFD)", "12"),
    ("4.4", "Level-2 Media Ingestion and Face Verification Pipeline (DFD)", "12"),
    ("4.5", "Use Case Diagram Across Platform Stakeholders and Actors", "13"),
    ("4.6", "Class Diagram of Core Domain Entities and Biometric Models", "14"),
    ("4.7", "Sequence Diagram of Guest Biometric Onboarding and Centroid Registration", "14"),
    ("4.8", "Sequence Diagram of Batch Media Upload and Asynchronous AI Inference", "15"),
    ("4.9", "Sequence Diagram of Automated Beat-Synchronized Reel Synthesis", "15"),
    ("5.1", "ArcFace Feature Space and Angular Decision Boundary", "18"),
    ("5.2", "Dynamic Beat-Synchronized Reel Timeline & Transition Grid", "19"),
    ("6.1", "Dashboard with System Status, Event Management, and Live Ingestion Feed", "21"),
    ("6.2", "Venue Signage QR Generator and Live Ingestion Monitor", "22"),
    ("6.3", "Guest Onboarding Interface with Multi-Angle Camera Alignment", "23"),
    ("6.4", "Live Biometric Kiosk Scanner Modal with Instant Recognition", "24"),
    ("6.5", "Instant Personalized Photo Gallery Feed with Confidence Indicators", "25"),
    ("6.6", "Batch Download and Streaming Zip Archive Generation Interface", "26"),
    ("6.7", "Creative Memory Reel Studio with 128 BPM Beat Grid and Pacing Controls", "27"),
    ("6.8", "Procedural Web Audio Synthesizer Controls and Dynamic Color Grading Lab", "28"),
    ("6.9", "Capacitor Mobile Native Application Verified on Oppo Reno 11 5G", "29"),
    ("7.1", "Receiver Operating Characteristic (ROC) Verification Curve", "31"),
    ("7.2", "Vector Query Latency Scaling with FAISS Index Size", "32")
]

tables_master = [
    ("2.1", "Summary of Key Literature in Face Recognition & Vector Search", "4"),
    ("2.2", "Mapping Project Objectives to UN Sustainable Development Goals", "5"),
    ("2.3", "Project Phases, Deliverables, and Implementation Milestones", "6"),
    ("3.1", "Functional Requirements Specification (FR-01 to FR-10)", "7"),
    ("3.2", "Non-Functional Requirements Specification", "8"),
    ("3.3", "Hardware Specification for Development, Edge, and Production", "9"),
    ("3.4", "Software Specification and Development Environment", "9"),
    ("4.1", "DFD Process Data Dictionary and Schema Transformations", "12"),
    ("4.2", "Actor Specifications and Role Permutations", "13"),
    ("4.3", "REST API Interface and Component Contracts Specification", "15"),
    ("5.1", "Benchmark Datasets and Biometric Evaluation Models", "19"),
    ("5.2", "Automated Test Suites (Unit, Integration, Biometric, End-to-End)", "20"),
    ("5.3", "Representative Test Cases Across Functional Scenarios", "20"),
    ("7.1", "Multi-Scale Tiling Face Detection Recall in Crowded Event Imagery", "30"),
    ("7.2", "ArcFace Angular Margin Optimization Hyperparameters (RQ2)", "31"),
    ("7.3", "CPU vs GPU Inference Latency and System Throughput Benchmark", "31"),
    ("7.4", "FAISS Vector Search Latency vs Brute-Force Euclidean Distance", "32"),
    ("7.5", "Multi-Angle Centroid Verification Robustness Under Pose & Lighting", "32"),
    ("7.6", "Dynamic Beat-Synchronization Latency & Alignment Precision", "33"),
    ("7.7", "Celery/Redis Queue Fault Tolerance & Thread Fallback Benchmark", "33"),
    ("7.8", "Formal Statistical Hypothesis Testing Summary (RQ1 to RQ5)", "34"),
    ("7.9", "Comparison with Academic State-of-the-Art Baselines", "34"),
    ("7.10", "Operational Cloud Resource & Hosting Cost Breakdown per Event", "35"),
    ("7.11", "Commercial Event Photography SaaS Cost Comparison", "35")
]

# Load original docx
doc = docx.Document('docs/Memora_Report_Rewritten-1.docx')

# 1. Clear all headers completely
clear_all_headers(doc)

# 2. Configure margins matching CyberTwin
for sec in doc.sections:
    sec.top_margin = Inches(1.0)
    sec.bottom_margin = Inches(1.0)
    sec.left_margin = Inches(1.17)
    sec.right_margin = Inches(0.95)
    sec.header_distance = Inches(0.5)
    sec.footer_distance = Inches(0.5)

# 3. Configure styles to pure black Times New Roman
for s_name in ['Normal', 'Heading 1', 'Heading 2', 'Heading 3', 'Heading 4']:
    if s_name in doc.styles:
        st = doc.styles[s_name]
        st.font.name = 'Times New Roman'
        st.font.color.rgb = RGBColor(0, 0, 0)
        if s_name == 'Normal':
            st.font.size = Pt(12)
            st.paragraph_format.line_spacing = 1.15
            st.paragraph_format.space_after = Pt(5)
            st.paragraph_format.space_before = Pt(0)
            st.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

# Remove the old SDT Table of Contents completely from body XML
sdts = doc._body._element.findall(docx.oxml.ns.qn('w:sdt'))
for sdt in sdts:
    doc._body._element.remove(sdt)

# Remove all old list paragraphs between LIST OF FIGURES, LIST OF TABLES, and LIST OF ABBREVIATIONS
in_list_zone = False
for p in list(doc.paragraphs):
    txt = p.text.strip()
    if txt == "LIST OF FIGURES":
        in_list_zone = "FIG"
        continue
    elif txt == "LIST OF TABLES":
        in_list_zone = "TBL"
        continue
    elif txt == "LIST OF ABBREVIATIONS":
        in_list_zone = False
        continue

    if in_list_zone == "FIG" and (txt.startswith("Figure ") or txt == ""):
        p._p.getparent().remove(p._p)
    elif in_list_zone == "TBL" and (txt.startswith("Table ") or txt == ""):
        p._p.getparent().remove(p._p)

# Format all headings and paragraphs
prelim_titles = [
    "DECLARATION", "CERTIFICATE", "ACKNOWLEDGEMENTS", "TABLE OF CONTENTS",
    "LIST OF FIGURES", "LIST OF TABLES", "LIST OF ABBREVIATIONS",
    "SYMBOLS AND NOTATIONS", "ABSTRACT"
]

for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if not txt:
        continue

    # Preliminary Headings: Centered, 15pt Bold
    if txt in prelim_titles:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(16)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(15)
            r.font.color.rgb = RGBColor(0, 0, 0)
            r.bold = True
        continue

    # CHAPTER X: Centered, 16pt Bold
    if txt.startswith("CHAPTER "):
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(12)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(16)
            r.font.color.rgb = RGBColor(0, 0, 0)
            r.bold = True
        continue

    # Main Chapter Title (Heading 1: Left, 14pt Bold, Pure Black)
    if p.style.name == 'Heading 1' and txt not in prelim_titles:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(14)
            r.font.color.rgb = RGBColor(0, 0, 0)
            r.bold = True
        continue

    # Section Heading (Heading 2: Left, 14pt Bold, Pure Black)
    if p.style.name == 'Heading 2':
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(14)
            r.font.color.rgb = RGBColor(0, 0, 0)
            r.bold = True
        continue

    # Subsection Heading (Heading 3: Left, 12pt Bold, Pure Black)
    if p.style.name == 'Heading 3':
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(12)
            r.font.color.rgb = RGBColor(0, 0, 0)
            r.bold = True
        continue

    # Level 4 Headings (Algorithms / RQ questions: Pure Black)
    if p.style.name == 'Heading 4' or txt.startswith("Algorithm ") or (txt.startswith("RQ") and ":" in txt):
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(12)
            r.font.color.rgb = RGBColor(0, 0, 0)
            r.bold = True
        continue

    # Figure Captions
    if txt.startswith("Figure "):
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(12)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            r.font.color.rgb = RGBColor(0, 0, 0)
        continue

    if txt.startswith("Table ") and (":" in txt or "\t" in txt) and len(txt) < 130:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            r.font.color.rgb = RGBColor(0, 0, 0)
            r.bold = True
        continue

    # References entries
    if re.match(r'^\[\d+\]', txt):
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Inches(0.35)
        p.paragraph_format.first_line_indent = Inches(-0.35)
        p.paragraph_format.space_after = Pt(4)
        for r in p.runs:
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11)
            r.font.color.rgb = RGBColor(0, 0, 0)
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
                    r.font.color.rgb = RGBColor(0, 0, 0)
                    if not r.font.size:
                        r.font.size = Pt(12)

# Format all data tables with clean borders and padding
for t_idx, tbl in enumerate(doc.tables):
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    if t_idx in [0, 1, 2]:
        for row in tbl.rows:
            for c in row.cells:
                set_cell_margins(c, top=40, bottom=40, left=60, right=60)
                for cp in c.paragraphs:
                    for cr in cp.runs:
                        cr.font.name = 'Times New Roman'
                        cr.font.color.rgb = RGBColor(0, 0, 0)
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
                add_header_bottom_border(c)
            
            for cp in c.paragraphs:
                cp.paragraph_format.space_before = Pt(0)
                cp.paragraph_format.space_after = Pt(1)
                cp.paragraph_format.line_spacing = 1.05
                for cr in cp.runs:
                    cr.font.name = 'Times New Roman'
                    cr.font.color.rgb = RGBColor(0, 0, 0)
                    if is_header:
                        cr.bold = True
                        cr.font.size = Pt(10)
                    else:
                        if not cr.font.size or cr.font.size.pt > 10.5:
                            cr.font.size = Pt(9.5)

# Insert TOC, LOF, LOT
target_lof = None
target_lot = None
target_loa = None
for p in doc.paragraphs:
    if p.text.strip() == "LIST OF FIGURES":
        target_lof = p
    elif p.text.strip() == "LIST OF TABLES":
        target_lot = p
    elif p.text.strip() == "LIST OF ABBREVIATIONS":
        target_loa = p

# 1. Insert TOC
p_toc_heading = target_lof.insert_paragraph_before("TABLE OF CONTENTS")
p_toc_heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_toc_heading.paragraph_format.space_before = Pt(0)
p_toc_heading.paragraph_format.space_after = Pt(16)
for r in p_toc_heading.runs:
    r.font.name = 'Times New Roman'
    r.font.size = Pt(15)
    r.font.color.rgb = RGBColor(0, 0, 0)
    r.bold = True

pPr = p_toc_heading._p.get_or_add_pPr()
pPr.append(parse_xml(f'<w:pageBreakBefore {nsdecls("w")}/>'))

tbl_toc = doc.add_table(rows=len(toc_items) + 1, cols=3)
tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
set_three_line_borders(tbl_toc)

row0 = tbl_toc.rows[0]
trPr = row0._tr.get_or_add_trPr()
trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

hdr_titles = ["Sl. No.", "Contents", "Page No."]
for c_idx, title in enumerate(hdr_titles):
    cell = row0.cells[c_idx]
    set_cell_margins(cell, top=50, bottom=50, left=60, right=60)
    add_header_bottom_border(cell)
    cp = cell.paragraphs[0]
    cp.paragraph_format.space_before = Pt(0)
    cp.paragraph_format.space_after = Pt(1)
    if c_idx == 2:
        cp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    cr = cp.add_run(title)
    cr.font.name = 'Times New Roman'
    cr.font.size = Pt(12)
    cr.font.color.rgb = RGBColor(0, 0, 0)
    cr.bold = True

for r_idx, (sl, content, pg, is_bold) in enumerate(toc_items):
    row = tbl_toc.rows[r_idx + 1]
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
    
    c0 = row.cells[0]
    set_cell_margins(c0, top=35, bottom=35, left=40, right=40)
    cp0 = c0.paragraphs[0]
    cp0.paragraph_format.space_before = Pt(0)
    cp0.paragraph_format.space_after = Pt(0)
    cr0 = cp0.add_run(sl)
    cr0.font.name = 'Times New Roman'
    cr0.font.size = Pt(11)
    cr0.font.color.rgb = RGBColor(0, 0, 0)
    if is_bold:
        cr0.bold = True

    c1 = row.cells[1]
    set_cell_margins(c1, top=35, bottom=35, left=40, right=40)
    cp1 = c1.paragraphs[0]
    cp1.paragraph_format.space_before = Pt(0)
    cp1.paragraph_format.space_after = Pt(0)
    if sl.count('.') == 2:
        cp1.paragraph_format.left_indent = Inches(0.18)
    cr1 = cp1.add_run(content)
    cr1.font.name = 'Times New Roman'
    cr1.font.size = Pt(11)
    cr1.font.color.rgb = RGBColor(0, 0, 0)
    if is_bold:
        cr1.bold = True

    c2 = row.cells[2]
    set_cell_margins(c2, top=35, bottom=35, left=40, right=40)
    cp2 = c2.paragraphs[0]
    cp2.paragraph_format.space_before = Pt(0)
    cp2.paragraph_format.space_after = Pt(0)
    cp2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    cr2 = cp2.add_run(pg)
    cr2.font.name = 'Times New Roman'
    cr2.font.size = Pt(11)
    cr2.font.color.rgb = RGBColor(0, 0, 0)
    if is_bold:
        cr2.bold = True

col_widths_toc = [Inches(0.7), Inches(4.7), Inches(0.8)]
for row in tbl_toc.rows:
    for c_idx, w in enumerate(col_widths_toc):
        row.cells[c_idx].width = w

target_lof._p.addprevious(tbl_toc._tbl)

# 2. Add page break before LIST OF FIGURES
pPr_lof = target_lof._p.get_or_add_pPr()
pPr_lof.append(parse_xml(f'<w:pageBreakBefore {nsdecls("w")}/>'))

tbl_lof = doc.add_table(rows=len(figures_master) + 1, cols=3)
tbl_lof.alignment = WD_TABLE_ALIGNMENT.CENTER
set_three_line_borders(tbl_lof)

row0 = tbl_lof.rows[0]
trPr = row0._tr.get_or_add_trPr()
trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

lof_titles = ["Figure No.", "Title", "Page"]
for c_idx, title in enumerate(lof_titles):
    cell = row0.cells[c_idx]
    set_cell_margins(cell, top=50, bottom=50, left=60, right=60)
    add_header_bottom_border(cell)
    cp = cell.paragraphs[0]
    cp.paragraph_format.space_before = Pt(0)
    cp.paragraph_format.space_after = Pt(1)
    if c_idx == 2:
        cp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    cr = cp.add_run(title)
    cr.font.name = 'Times New Roman'
    cr.font.size = Pt(12)
    cr.font.color.rgb = RGBColor(0, 0, 0)
    cr.bold = True

for r_idx, (fnum, ftitle, fpage) in enumerate(figures_master):
    row = tbl_lof.rows[r_idx + 1]
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
    
    c0 = row.cells[0]
    set_cell_margins(c0, top=35, bottom=35, left=40, right=40)
    cp0 = c0.paragraphs[0]
    cp0.paragraph_format.space_before = Pt(0)
    cp0.paragraph_format.space_after = Pt(0)
    cr0 = cp0.add_run(fnum)
    cr0.font.name = 'Times New Roman'
    cr0.font.size = Pt(11)
    cr0.font.color.rgb = RGBColor(0, 0, 0)

    c1 = row.cells[1]
    set_cell_margins(c1, top=35, bottom=35, left=40, right=40)
    cp1 = c1.paragraphs[0]
    cp1.paragraph_format.space_before = Pt(0)
    cp1.paragraph_format.space_after = Pt(0)
    cr1 = cp1.add_run(ftitle)
    cr1.font.name = 'Times New Roman'
    cr1.font.size = Pt(11)
    cr1.font.color.rgb = RGBColor(0, 0, 0)

    c2 = row.cells[2]
    set_cell_margins(c2, top=35, bottom=35, left=40, right=40)
    cp2 = c2.paragraphs[0]
    cp2.paragraph_format.space_before = Pt(0)
    cp2.paragraph_format.space_after = Pt(0)
    cp2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    cr2 = cp2.add_run(fpage)
    cr2.font.name = 'Times New Roman'
    cr2.font.size = Pt(11)
    cr2.font.color.rgb = RGBColor(0, 0, 0)

col_widths_lof = [Inches(1.0), Inches(4.4), Inches(0.8)]
for row in tbl_lof.rows:
    for c_idx, w in enumerate(col_widths_lof):
        row.cells[c_idx].width = w

target_lot._p.addprevious(tbl_lof._tbl)

# 3. Add page break before LIST OF TABLES
pPr_lot = target_lot._p.get_or_add_pPr()
pPr_lot.append(parse_xml(f'<w:pageBreakBefore {nsdecls("w")}/>'))

tbl_lot = doc.add_table(rows=len(tables_master) + 1, cols=3)
tbl_lot.alignment = WD_TABLE_ALIGNMENT.CENTER
set_three_line_borders(tbl_lot)

row0 = tbl_lot.rows[0]
trPr = row0._tr.get_or_add_trPr()
trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

lot_titles = ["Table No.", "Title", "Page No."]
for c_idx, title in enumerate(lot_titles):
    cell = row0.cells[c_idx]
    set_cell_margins(cell, top=50, bottom=50, left=60, right=60)
    add_header_bottom_border(cell)
    cp = cell.paragraphs[0]
    cp.paragraph_format.space_before = Pt(0)
    cp.paragraph_format.space_after = Pt(1)
    if c_idx == 2:
        cp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    cr = cp.add_run(title)
    cr.font.name = 'Times New Roman'
    cr.font.size = Pt(12)
    cr.font.color.rgb = RGBColor(0, 0, 0)
    cr.bold = True

for r_idx, (tnum, ttitle, tpage) in enumerate(tables_master):
    row = tbl_lot.rows[r_idx + 1]
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
    
    c0 = row.cells[0]
    set_cell_margins(c0, top=35, bottom=35, left=40, right=40)
    cp0 = c0.paragraphs[0]
    cp0.paragraph_format.space_before = Pt(0)
    cp0.paragraph_format.space_after = Pt(0)
    cr0 = cp0.add_run(tnum)
    cr0.font.name = 'Times New Roman'
    cr0.font.size = Pt(11)
    cr0.font.color.rgb = RGBColor(0, 0, 0)

    c1 = row.cells[1]
    set_cell_margins(c1, top=35, bottom=35, left=40, right=40)
    cp1 = c1.paragraphs[0]
    cp1.paragraph_format.space_before = Pt(0)
    cp1.paragraph_format.space_after = Pt(0)
    cr1 = cp1.add_run(ttitle)
    cr1.font.name = 'Times New Roman'
    cr1.font.size = Pt(11)
    cr1.font.color.rgb = RGBColor(0, 0, 0)

    c2 = row.cells[2]
    set_cell_margins(c2, top=35, bottom=35, left=40, right=40)
    cp2 = c2.paragraphs[0]
    cp2.paragraph_format.space_before = Pt(0)
    cp2.paragraph_format.space_after = Pt(0)
    cp2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    cr2 = cp2.add_run(tpage)
    cr2.font.name = 'Times New Roman'
    cr2.font.size = Pt(11)
    cr2.font.color.rgb = RGBColor(0, 0, 0)

col_widths_lot = [Inches(1.0), Inches(4.4), Inches(0.8)]
for row in tbl_lot.rows:
    for c_idx, w in enumerate(col_widths_lot):
        row.cells[c_idx].width = w

if target_loa:
    target_loa._p.addprevious(tbl_lot._tbl)
    pPr_loa = target_loa._p.get_or_add_pPr()
    pPr_loa.append(parse_xml(f'<w:pageBreakBefore {nsdecls("w")}/>'))

# Save final document
final_docx = os.path.abspath('docs/Memora_Project_Report_Final_CyberTwin_Format.docx')
doc.save(final_docx)
print(f"Saved completed docx: {final_docx}")

# Export to PDF via Word COM
word = win32com.client.Dispatch('Word.Application')
word.Visible = False
final_pdf = os.path.abspath('docs/Memora_Project_Report_Final_CyberTwin_Format.pdf')
wdoc = word.Documents.Open(final_docx)
wdoc.SaveAs(final_pdf, FileFormat=17) # wdFormatPDF = 17
wdoc.Close()
word.Quit()
print(f"Exported final PDF: {final_pdf}")
