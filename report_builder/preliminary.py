"""
Preliminary Sections for BCSE497J Project-I Report
Strict adherence to CyberTwin_Project_Report_Final67 template and VIT guidelines.
Order:
Page 1: Cover Page (unnumbered)
Page 2: Declaration (i)
Page 3: Certificate (ii)
Page 4: Acknowledgements (iii)
Page 5: Table of Contents Part 1 (iv)
Page 6: Table of Contents Part 2 (v)
Page 7: List of Figures (vi)
Page 8: List of Tables (vii)
Page 9: List of Abbreviations (viii)
Page 10: Symbols & Notations (ix)
Page 11: Abstract (x)
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Flowable, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from report_builder.canvas import PageTracker, VITReportCanvas, to_roman

def build_cover_page(story, styles):
    story.append(Spacer(1, 15))
    story.append(Paragraph("B.Tech. BCSE497J - Project-I", ParagraphStyle('CoverSub1', parent=styles['VITReportSubtitle'], fontSize=13, spaceAfter=20)))
    
    story.append(Spacer(1, 12))
    story.append(Paragraph("MEMORA: AI-POWERED EVENT MEDIA DISCOVERY & REEL SYNTHESIS PLATFORM", styles['VITReportTitle']))
    
    story.append(Spacer(1, 22))
    story.append(Paragraph("Submitted in partial fulfillment of the requirements for the degree of", ParagraphStyle('CoverText1', fontName='Times-Roman', fontSize=11, alignment=TA_CENTER, leading=16)))
    story.append(Paragraph("<b>Bachelor of Technology</b>", ParagraphStyle('CoverText2', fontName='Times-Bold', fontSize=13, alignment=TA_CENTER, leading=18)))
    story.append(Paragraph("in", ParagraphStyle('CoverText3', fontName='Times-Roman', fontSize=11, alignment=TA_CENTER, leading=16)))
    story.append(Paragraph("<b>Computer Science and Engineering</b>", ParagraphStyle('CoverText4', fontName='Times-Bold', fontSize=12, alignment=TA_CENTER, leading=16, spaceAfter=16)))
    
    story.append(Paragraph("by", ParagraphStyle('CoverBy', fontName='Times-Roman', fontSize=11, alignment=TA_CENTER, leading=14)))
    story.append(Spacer(1, 8))

    # Student Names Table
    student_data = [
        [Paragraph("<b>23BKT0053</b>", styles['VITBodyText']), Paragraph("<b>SAI VARDHAN REDDY</b>", styles['VITBodyText'])],
        [Paragraph("<b>23BCB0043</b>", styles['VITBodyText']), Paragraph("<b>SRI RITHVIK</b>", styles['VITBodyText'])]
    ]
    t_stud = Table(student_data, colWidths=[130, 210])
    t_stud.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_stud)

    story.append(Spacer(1, 30))
    story.append(Paragraph("Under the Supervision of", ParagraphStyle('CoverSup', fontName='Times-Bold', fontSize=12, alignment=TA_CENTER, leading=16)))
    story.append(Spacer(1, 5))

    guide_data = [
        [Paragraph("<b>Dr. Kaspar S</b>", ParagraphStyle('G1', fontName='Times-Bold', fontSize=12, alignment=TA_CENTER))],
        [Paragraph("Associate Professor / Senior Faculty", ParagraphStyle('G2', fontName='Times-Roman', fontSize=10.5, alignment=TA_CENTER))],
        [Paragraph("School of Computer Science and Engineering (SCOPE)", ParagraphStyle('G3', fontName='Times-Roman', fontSize=10.5, alignment=TA_CENTER))]
    ]
    t_guide = Table(guide_data, colWidths=[360])
    t_guide.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_guide)

    story.append(Spacer(1, 50))
    story.append(Paragraph("<b>School of Computer Science and Engineering</b>", ParagraphStyle('CoverInst1', fontName='Times-Bold', fontSize=12, alignment=TA_CENTER, leading=16)))
    story.append(Paragraph("<b>Vellore Institute of Technology, Vellore - 632014</b>", ParagraphStyle('CoverInst2', fontName='Times-Bold', fontSize=11, alignment=TA_CENTER, leading=16)))
    story.append(Paragraph("October 2026", ParagraphStyle('CoverDate', fontName='Times-Roman', fontSize=11, alignment=TA_CENTER, leading=16, spaceBefore=6)))
    story.append(PageBreak())


def build_declaration(story, styles):
    story.append(Spacer(1, 20))
    story.append(Paragraph("DECLARATION", styles['VITPrelimHeading']))
    story.append(Spacer(1, 15))

    p1 = ("I hereby declare that the project entitled <b>MEMORA: AI-POWERED EVENT MEDIA DISCOVERY & "
          "REEL SYNTHESIS PLATFORM</b> submitted by us, for the award of the degree of <b>Bachelor of Technology "
          "in Computer Science and Engineering</b> to <b>Vellore Institute of Technology (VIT)</b> is a record of "
          "bonafide work carried out by us under the supervision of <b>Dr. Kaspar S</b>, Associate Professor, "
          "School of Computer Science and Engineering (SCOPE), Vellore Institute of Technology, Vellore.")
    story.append(Paragraph(p1, styles['VITBodyText']))

    story.append(Spacer(1, 12))
    p2 = ("We further declare that the work reported in this project has not been submitted and will not be "
          "submitted, either in part or in full, for the award of any other degree or diploma in this institute "
          "or any other institute or university.")
    story.append(Paragraph(p2, styles['VITBodyText']))

    story.append(Spacer(1, 65))

    sig_data = [
        [Paragraph("<b>Place :</b> Vellore", styles['VITBodyText']), Paragraph("<b>Signature of the Candidates:</b>", styles['VITBodyText'])],
        [Paragraph("<b>Date :</b> 27-10-2026", styles['VITBodyText']), Paragraph("1. Sai Vardhan Reddy (23BKT0053)<br/>2. Sri Rithvik (23BCB0043)", styles['VITBodyText'])]
    ]
    t_sig = Table(sig_data, colWidths=[200, 280])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_sig)
    story.append(PageBreak())


def build_certificate(story, styles):
    story.append(Spacer(1, 20))
    story.append(Paragraph("CERTIFICATE", styles['VITPrelimHeading']))
    story.append(Spacer(1, 15))

    p1 = ("This is to certify that the project entitled <b>MEMORA: AI-POWERED EVENT MEDIA DISCOVERY & "
          "REEL SYNTHESIS PLATFORM</b> submitted by <b>Sai Vardhan Reddy (23BKT0053)</b> and <b>Sri Rithvik "
          "(23BCB0043)</b>, School of Computer Science and Engineering, VIT, for the award of the degree of "
          "<b>Bachelor of Technology in Computer Science and Engineering</b>, is a record of bonafide work carried "
          "out by them under my supervision during Fall Semester 2024–2025, as per the VIT code of academic "
          "and research ethics.")
    story.append(Paragraph(p1, styles['VITBodyText']))

    story.append(Spacer(1, 12))
    p2 = ("The contents of this report have not been submitted and will not be submitted either in part or in full, "
          "for the award of any other degree or diploma in this institute or any other institute or university. "
          "The project fulfills the requirements and regulations of the University and in my opinion meets the "
          "necessary standards for submission.")
    story.append(Paragraph(p2, styles['VITBodyText']))

    story.append(Spacer(1, 45))

    cert_data = [
        [Paragraph("<b>Place :</b> Vellore", styles['VITBodyText']), Paragraph("<b>Signature of the Guide</b>", styles['VITBodyText'])],
        [Paragraph("<b>Date :</b> 27-10-2026", styles['VITBodyText']), Paragraph("<b>Dr. Kaspar S</b><br/>Associate Professor, SCOPE<br/>Vellore Institute of Technology", styles['VITBodyText'])],
        [Spacer(1, 22), Spacer(1, 22)],
        [Paragraph("<b>Examiner(s):</b>", styles['VITBodyText']), Paragraph("<b>Head of the Department:</b>", styles['VITBodyText'])],
        [Paragraph("1. _______________________<br/>2. _______________________", styles['VITBodyText']),
         Paragraph("<b>Dr. Jaisankar N</b><br/>Dean, School of Computer Science and Engineering<br/>Vellore Institute of Technology", styles['VITBodyText'])]
    ]
    t_cert = Table(cert_data, colWidths=[220, 260])
    t_cert.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_cert)
    story.append(PageBreak())


def build_acknowledgements(story, styles):
    story.append(Spacer(1, 20))
    story.append(Paragraph("ACKNOWLEDGEMENTS", styles['VITPrelimHeading']))
    story.append(Spacer(1, 15))

    p1 = ("We are deeply grateful to the management of <b>Vellore Institute of Technology (VIT)</b> for providing "
          "us with the opportunity and advanced computational resources to undertake this ambitious project. "
          "Their steadfast commitment to fostering a world-class, research-driven learning environment has been "
          "instrumental throughout our academic journey. The high-performance compute clusters and digital library "
          "infrastructure provided by VIT have enabled us to explore, implement, and benchmark state-of-the-art deep "
          "learning architectures to their fullest potential.")
    story.append(Paragraph(p1, styles['VITBodyText']))

    story.append(Spacer(1, 10))
    p2 = ("Our sincere and profound thanks to <b>Dr. Jaisankar N</b>, Dean of the School of Computer Science and "
          "Engineering (SCOPE), for his unwavering administrative support and scholarly encouragement. His visionary "
          "leadership and high standards for technical excellence have consistently inspired us to aim for rigor and "
          "real-world applicability. His leadership in nurturing an ecosystem of innovation and critical thinking has "
          "provided the optimal foundation for our undergraduate research.")
    story.append(Paragraph(p2, styles['VITBodyText']))

    story.append(Spacer(1, 10))
    p3 = ("We express our deepest appreciation to our project supervisor and mentor, <b>Dr. Kaspar S</b>, "
          "Associate Professor, School of Computer Science and Engineering, for his invaluable guidance, technical "
          "acumen, and patient critique at every milestone. His profound insights into computer vision pipelines, "
          "biometric verification nuances, and distributed asynchronous systems helped us overcome critical performance "
          "bottlenecks. His consistent encouragement pushed us to explore novel combinations of multi-scale tiling, "
          "FAISS vector search, and procedural audio synthesis.")
    story.append(Paragraph(p3, styles['VITBodyText']))

    story.append(Spacer(1, 10))
    p4 = ("We also extend our warm gratitude to the faculty and technical staff of the School of Computer Science "
          "and Engineering for their constant academic cooperation. Finally, we thank our parents and fellow peers "
          "for their relentless encouragement and understanding throughout the ideation, coding, and testing phases "
          "of this project.")
    story.append(Paragraph(p4, styles['VITBodyText']))

    story.append(Spacer(1, 35))
    story.append(Paragraph("<b>Sai Vardhan Reddy (23BKT0053)</b><br/><b>Sri Rithvik (23BCB0043)</b>", ParagraphStyle('AckSign', fontName='Times-Bold', fontSize=11, alignment=TA_RIGHT, leading=16)))
    story.append(PageBreak())


def build_table_of_contents(story, styles, page_registry):
    story.append(PageTracker('toc', page_registry))
    
    def get_pg(key, default_val):
        val = page_registry.get(key)
        if val is None:
            return str(default_val)
        if val < VITReportCanvas.first_chapter_page:
            return to_roman(val - 1)
        return str(val - VITReportCanvas.first_chapter_page + 1)

    # PAGE 1 OF TOC (Roman iv): Covers Abstract and Chapters 1 - 4
    story.append(Spacer(1, 15))
    story.append(Paragraph("TABLE OF CONTENTS", styles['VITPrelimHeading']))
    story.append(Spacer(1, 10))

    toc_p1 = [
        ["Sl. No.", "Contents", "Page No."],
        ["", "Abstract", get_pg('abstract', 'x')],
        ["1.", "INTRODUCTION", get_pg('ch1', 1)],
        ["", "    1.1 Background", get_pg('sec_1_1', 1)],
        ["", "    1.2 Motivations", get_pg('sec_1_2', 1)],
        ["", "    1.3 Scope of the Project", get_pg('sec_1_3', 2)],
        ["2.", "PROJECT DESCRIPTION AND GOALS", get_pg('ch2', 3)],
        ["", "    2.1 Literature Review", get_pg('sec_2_1', 3)],
        ["", "       2.1.1 Multi-Task Face Detection and Alignment", get_pg('sec_2_1_1', 3)],
        ["", "       2.1.2 Efficient Edge Face Localization and Tiling", get_pg('sec_2_1_2', 4)],
        ["", "       2.1.3 Hyperspherical Loss Formulations and Embeddings", get_pg('sec_2_1_3', 4)],
        ["", "       2.1.4 Deep Metric Learning and Illumination Invariance", get_pg('sec_2_1_4', 5)],
        ["", "       2.1.5 High-Dimensional Vector Indexing", get_pg('sec_2_1_5', 5)],
        ["", "    2.2 Research Gap", get_pg('sec_2_2', 6)],
        ["", "    2.3 Objectives", get_pg('sec_2_3', 7)],
        ["", "    2.4 Problem Statement", get_pg('sec_2_4', 8)],
        ["", "    2.5 Project Plan", get_pg('sec_2_5', 9)],
        ["3.", "TECHNICAL SPECIFICATION", get_pg('ch3', 11)],
        ["", "    3.1 Requirements", get_pg('sec_3_1', 11)],
        ["", "       3.1.1 Functional", get_pg('sec_3_1_1', 11)],
        ["", "       3.1.2 Non-Functional", get_pg('sec_3_1_2', 13)],
        ["", "    3.2 Feasibility Study", get_pg('sec_3_2', 14)],
        ["", "       3.2.1 Technical Feasibility", get_pg('sec_3_2_1', 14)],
        ["", "       3.2.2 Economic Feasibility", get_pg('sec_3_2_2', 15)],
        ["", "       3.2.3 Social Feasibility", get_pg('sec_3_2_3', 15)],
        ["", "    3.3 System Specification", get_pg('sec_3_3', 16)],
        ["", "       3.3.1 Hardware Specification", get_pg('sec_3_3_1', 16)],
        ["", "       3.3.2 Software Specification", get_pg('sec_3_3_2', 17)],
        ["4.", "DESIGN APPROACH AND DETAILS", get_pg('ch4', 18)],
        ["", "    4.1 System Architecture", get_pg('sec_4_1', 18)],
        ["", "    4.2 Design", get_pg('sec_4_2', 20)],
        ["", "       4.2.1 Data Flow Diagram", get_pg('sec_4_2_1', 20)],
        ["", "       4.2.2 Use Case Diagram", get_pg('sec_4_2_2', 23)],
        ["", "       4.2.3 Class Diagram", get_pg('sec_4_2_3', 25)],
        ["", "       4.2.4 Sequence Diagram", get_pg('sec_4_2_4', 27)]
    ]

    t_data_p1 = []
    for r in toc_p1:
        is_bold = r[0] != "" or r[1].startswith("1.") or r[1].startswith("2.") or r[1].startswith("3.") or r[1].startswith("4.") or r[1] == "Abstract"
        style_c = styles['VITTocItemBold'] if is_bold else styles['VITTocItem']
        t_data_p1.append([
            Paragraph(r[0], styles['VITTocItemBold'] if is_bold else styles['VITTocItem']),
            Paragraph(r[1], style_c),
            Paragraph(r[2], styles['VITTocPage'])
        ])

    t_toc1 = Table(t_data_p1, colWidths=[40, 390, 50])
    t_toc1.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#0F172A")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
    ]))
    story.append(t_toc1)
    story.append(PageBreak())

    # PAGE 2 OF TOC (Roman v): Covers Chapters 5 - 9 and Appendix A
    story.append(Spacer(1, 15))
    story.append(Paragraph("TABLE OF CONTENTS (Continued)", styles['VITPrelimHeading']))
    story.append(Spacer(1, 10))

    toc_p2 = [
        ["Sl. No.", "Contents", "Page No."],
        ["5.", "METHODOLOGY AND TESTING", get_pg('ch5', 30)],
        ["", "    5.1 Module Description", get_pg('sec_5_1', 30)],
        ["", "       5.1.1 Ingestion and Tiling Engine", get_pg('sec_5_1_1', 30)],
        ["", "       5.1.2 Preprocessing and CLAHE Normalization", get_pg('sec_5_1_2', 31)],
        ["", "       5.1.3 SCRFD Deep Face Detection", get_pg('sec_5_1_3', 31)],
        ["", "       5.1.4 ArcFace Embedding Extraction", get_pg('sec_5_1_4', 32)],
        ["", "       5.1.5 FAISS Vector Similarity & Centroid Clustering", get_pg('sec_5_1_5', 34)],
        ["", "       5.1.6 Automated Reel Synthesis & Procedural Audio", get_pg('sec_5_1_6', 35)],
        ["", "    5.2 Experimental Methodology", get_pg('sec_5_2', 36)],
        ["", "    5.3 Testing", get_pg('sec_5_3', 37)],
        ["6.", "PROJECT DEMONSTRATION", get_pg('ch6', 39)],
        ["", "    6.1 Web Dashboard & Organizer Management", get_pg('sec_6_1', 39)],
        ["", "    6.2 Zero-Install Guest Onboarding & Biometric Scanner", get_pg('sec_6_2', 40)],
        ["", "    6.3 Automated Photo Matching & Instant Personal Gallery", get_pg('sec_6_3', 41)],
        ["", "    6.4 Automated Memory Reel Synthesis & Beat Pacing Lab", get_pg('sec_6_4', 42)],
        ["", "    6.5 Cross-Platform Mobile Deployment (Oppo Reno 11 5G)", get_pg('sec_6_5', 43)],
        ["7.", "RESULT AND DISCUSSION", get_pg('ch7', 44)],
        ["", "    7.1 Experimental Results", get_pg('sec_7_1', 44)],
        ["", "       7.1.1 RQ1: Multi-Scale Tiling Face Detection Recall", get_pg('sec_7_1_1', 44)],
        ["", "       7.1.2 RQ2: ArcFace Angular Margin Optimization", get_pg('sec_7_1_2', 45)],
        ["", "       7.1.3 RQ3: CPU vs GPU Latency & Throughput Trade-offs", get_pg('sec_7_1_3', 45)],
        ["", "       7.1.4 RQ4: FAISS Vector Scalability vs Brute-Force", get_pg('sec_7_1_4', 46)],
        ["", "       7.1.5 RQ5: Multi-Angle Centroid Verification Robustness", get_pg('sec_7_1_5', 47)],
        ["", "       7.1.6 RQ6: Dynamic Beat-Synchronization Precision", get_pg('sec_7_1_6', 48)],
        ["", "       7.1.7 RQ7: Celery/Redis Fault Tolerance & Thread Fallback", get_pg('sec_7_1_7', 48)],
        ["", "    7.2 Discussion", get_pg('sec_7_2', 49)],
        ["", "    7.3 Cost Analysis", get_pg('sec_7_3', 50)],
        ["8.", "CONCLUSION", get_pg('ch8', 51)],
        ["9.", "REFERENCES", get_pg('ch9', 52)],
        ["", "APPENDIX A – SAMPLE CODE", get_pg('app_a', 54)]
    ]

    t_data_p2 = []
    for r in toc_p2:
        is_bold = r[0] != "" or r[1].startswith("5.") or r[1].startswith("6.") or r[1].startswith("7.") or r[1].startswith("8.") or r[1].startswith("9.") or r[1].startswith("APPENDIX")
        style_c = styles['VITTocItemBold'] if is_bold else styles['VITTocItem']
        t_data_p2.append([
            Paragraph(r[0], styles['VITTocItemBold'] if is_bold else styles['VITTocItem']),
            Paragraph(r[1], style_c),
            Paragraph(r[2], styles['VITTocPage'])
        ])

    t_toc2 = Table(t_data_p2, colWidths=[40, 390, 50])
    t_toc2.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#0F172A")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
    ]))
    story.append(t_toc2)
    story.append(PageBreak())


def build_list_of_figures(story, styles, page_registry):
    story.append(PageTracker('lof', page_registry))
    story.append(Spacer(1, 15))
    story.append(Paragraph("LIST OF FIGURES", styles['VITPrelimHeading']))
    story.append(Spacer(1, 12))

    def get_pg(key, default_val):
        val = page_registry.get(key)
        if val is None:
            return str(default_val)
        return str(val - VITReportCanvas.first_chapter_page + 1)

    figs = [
        ("Figure No.", "Title", "Page No."),
        ("2.1", "Project Timeline and Engineering Work Breakdown (Gantt Chart)", get_pg('fig_gantt', 10)),
        ("4.1", "System Architecture of Memora 4-Tier Platform", get_pg('fig_arch', 19)),
        ("4.2", "Level-0 Context Data Flow Diagram (DFD)", get_pg('fig_dfd0', 21)),
        ("4.3", "Level-1 Functional Decomposition Data Flow Diagram (DFD)", get_pg('fig_dfd1', 22)),
        ("4.4", "Level-2 Media Ingestion and Face Verification Pipeline (DFD)", get_pg('fig_dfd2', 23)),
        ("4.5", "Use Case Diagram Across Platform Stakeholders and Actors", get_pg('fig_usecase', 24)),
        ("4.6", "Class Diagram of Core Domain Entities and Biometric Models", get_pg('fig_class', 26)),
        ("4.7", "Sequence Diagram of Guest Biometric Onboarding and Centroid Enrollment", get_pg('fig_seq1', 28)),
        ("4.8", "Sequence Diagram of Batch Media Upload and Asynchronous AI Indexing", get_pg('fig_seq2', 29)),
        ("4.9", "Sequence Diagram of Automated Beat-Synchronized Reel Synthesis", get_pg('fig_seq3', 29)),
        ("5.1", "ArcFace Feature Space and Angular Decision Boundary", get_pg('fig_arcface', 33)),
        ("5.2", "Dynamic Beat-Synchronized Reel Timeline & Transition Grid", get_pg('fig_reel_timeline', 36)),
        ("6.1", "Dashboard with System Status, Event Management, and Live Activity Log", get_pg('fig_demo_web', 39)),
        ("6.2", "Venue Signage QR Generator and Live Ingestion Monitor", get_pg('fig_demo_qr', 40)),
        ("6.3", "Guest Onboarding Interface with Multi-Angle Camera Alignment", get_pg('fig_demo_scanner', 40)),
        ("6.4", "Live Biometric Kiosk Scanner Modal with Instant Recognition HUD", get_pg('fig_demo_kiosk', 41)),
        ("6.5", "Instant Personalized Photo Gallery Feed with Confidence Indicators", get_pg('fig_demo_gallery', 41)),
        ("6.6", "Batch Download and Streaming Zip Archive Generation Interface", get_pg('fig_demo_zip', 42)),
        ("6.7", "Creative Memory Reel Studio with 128 BPM Beat Grid and Pacing Controls", get_pg('fig_demo_studio', 42)),
        ("6.8", "Procedural Web Audio Synthesizer Controls and Dynamic Color Grading Preview", get_pg('fig_demo_synth', 43)),
        ("6.9", "Capacitor Mobile Native Application Verified on Oppo Reno 11 5G", get_pg('fig_demo_mobile', 43)),
        ("7.1", "Receiver Operating Characteristic (ROC) Verification Curves", get_pg('fig_roc', 45)),
        ("7.2", "Vector Query Latency Scaling with FAISS Index Size", get_pg('fig_latency', 46))
    ]

    t_data = []
    for i, r in enumerate(figs):
        is_hdr = (i == 0)
        st_text = styles['VITTocItemBold'] if is_hdr else styles['VITTocItem']
        t_data.append([
            Paragraph(r[0], st_text),
            Paragraph(r[1], st_text),
            Paragraph(r[2], styles['VITTocPage'] if not is_hdr else st_text)
        ])

    t_fig = Table(t_data, colWidths=[65, 365, 50])
    t_fig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.2),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#0F172A")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
    ]))
    story.append(t_fig)
    story.append(PageBreak())


def build_list_of_tables(story, styles, page_registry):
    story.append(PageTracker('lot', page_registry))
    story.append(Spacer(1, 15))
    story.append(Paragraph("LIST OF TABLES", styles['VITPrelimHeading']))
    story.append(Spacer(1, 12))

    def get_pg(key, default_val):
        val = page_registry.get(key)
        if val is None:
            return str(default_val)
        return str(val - VITReportCanvas.first_chapter_page + 1)

    tbls = [
        ("Table No.", "Title", "Page No."),
        ("2.1", "Summary of Key Literature in Face Recognition & Vector Search", get_pg('tbl_lit_rev', 6)),
        ("2.2", "Mapping Project Objectives to UN Sustainable Development Goals", get_pg('tbl_sdg', 8)),
        ("2.3", "Project Phases, Deliverables, and Implementation Milestones", get_pg('tbl_phases', 9)),
        ("3.1", "Functional Requirements Specification (FR-01 to FR-10)", get_pg('tbl_fr', 12)),
        ("3.2", "Non-Functional Requirements Specification", get_pg('tbl_nfr', 13)),
        ("3.3", "Hardware Specification for Development, Edge, and Production Cluster", get_pg('tbl_hw_spec', 16)),
        ("3.4", "Software Specification and Development Environment", get_pg('tbl_sw_spec', 17)),
        ("4.1", "DFD Process Data Dictionary and Schema Transformations", get_pg('tbl_dfd_dict', 22)),
        ("4.2", "Actor Specifications and Role Permutations", get_pg('tbl_actors', 24)),
        ("4.3", "REST API Interface Contracts and WebSocket Telemetry Specifications", get_pg('tbl_api_spec', 25)),
        ("5.1", "Benchmark Datasets and Biometric Evaluation Models", get_pg('tbl_benchmarks', 36)),
        ("5.2", "Automated Test Suites (Unit, Integration, Biometric, End-to-End)", get_pg('tbl_test_suites', 37)),
        ("5.3", "Representative Test Cases Across Functional Scenarios", get_pg('tbl_test_cases', 38)),
        ("7.1", "Multi-Scale Tiling Face Detection Recall in Crowded Event Images (RQ1)", get_pg('tbl_rq1', 44)),
        ("7.2", "ArcFace Angular Margin Optimization Hyperparameters (RQ2)", get_pg('tbl_rq2', 45)),
        ("7.3", "CPU vs GPU Inference Latency and System Throughput Benchmarks (RQ3)", get_pg('tbl_rq3', 46)),
        ("7.4", "FAISS Vector Search Latency vs Brute-Force Euclidean Distance (RQ4)", get_pg('tbl_rq4', 46)),
        ("7.5", "Multi-Angle Centroid Verification Robustness Under Pose & Lighting (RQ5)", get_pg('tbl_rq5', 47)),
        ("7.6", "Dynamic Beat-Synchronization Latency & Alignment Precision (RQ6)", get_pg('tbl_rq6', 48)),
        ("7.7", "Celery/Redis Queue Fault Tolerance & Thread Fallback Benchmarks (RQ7)", get_pg('tbl_rq7', 48)),
        ("7.8", "Formal Statistical Hypothesis Testing Summary (RQ1 to RQ7)", get_pg('tbl_hypo_summary', 49)),
        ("7.9", "Comparison with Academic State-of-the-Art Baselines", get_pg('tbl_baselines', 50)),
        ("7.10", "Operational Cloud Resource & Hosting Cost Breakdown per Event", get_pg('tbl_cost_analysis', 51)),
        ("7.11", "Commercial Event Photography SaaS Cost Comparison", get_pg('tbl_saas_comp', 51))
    ]

    t_data_tbl = []
    for i, r in enumerate(tbls):
        is_hdr = (i == 0)
        st_text = styles['VITTocItemBold'] if is_hdr else styles['VITTocItem']
        t_data_tbl.append([
            Paragraph(r[0], st_text),
            Paragraph(r[1], st_text),
            Paragraph(r[2], styles['VITTocPage'] if not is_hdr else st_text)
        ])

    t_tbl = Table(t_data_tbl, colWidths=[65, 365, 50])
    t_tbl.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.1),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#0F172A")),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
    ]))
    story.append(t_tbl)
    story.append(PageBreak())


def build_list_of_abbreviations(story, styles):
    story.append(Spacer(1, 15))
    story.append(Paragraph("LIST OF ABBREVIATIONS", styles['VITPrelimHeading']))
    story.append(Spacer(1, 8))

    abbrs = [
        ("API", "Application Programming Interface"),
        ("BPM", "Beats Per Minute"),
        ("CDN", "Content Delivery Network"),
        ("CLAHE", "Contrast Limited Adaptive Histogram Equalization"),
        ("CNN", "Convolutional Neural Network"),
        ("CPU", "Central Processing Unit"),
        ("CUDA", "Compute Unified Device Architecture (NVIDIA)"),
        ("DFD", "Data Flow Diagram"),
        ("DPDP", "Digital Personal Data Protection Act (India, 2023)"),
        ("EXIF", "Exchangeable Image File Format"),
        ("FAISS", "Facebook AI Similarity Search"),
        ("FAR", "False Accept Rate"),
        ("FFT", "Fast Fourier Transform"),
        ("FPN", "Feature Pyramid Network"),
        ("FPS", "Frames Per Second"),
        ("FRR", "False Reject Rate"),
        ("GDPR", "General Data Protection Regulation (EU 2016/679)"),
        ("GPU", "Graphics Processing Unit"),
        ("HNSW", "Hierarchical Navigable Small World"),
        ("HTTP/HTTPS", "Hypertext Transfer Protocol (Secure)"),
        ("IEEE", "Institute of Electrical and Electronics Engineers"),
        ("JSON", "JavaScript Object Notation"),
        ("L2", "Euclidean Norm (L2 Regularization)"),
        ("MTCNN", "Multi-Task Cascaded Convolutional Networks"),
        ("NMS", "Non-Maximum Suppression"),
        ("NPU", "Neural Processing Unit"),
        ("ONNX", "Open Neural Network Exchange"),
        ("PWA", "Progressive Web Application"),
        ("QR", "Quick Response (2D Barcode)"),
        ("RAM", "Random Access Memory"),
        ("REST", "Representational State Transfer"),
        ("ROC", "Receiver Operating Characteristic"),
        ("SCOPE", "School of Computer Science and Engineering"),
        ("SCRFD", "Sample and Computation Redistribution for Efficient Face Detection"),
        ("SDG", "Sustainable Development Goal (United Nations)"),
        ("SSD", "Solid State Drive"),
        ("SUS", "System Usability Scale"),
        ("TAR", "True Accept Rate"),
        ("TRL", "Technology Readiness Level"),
        ("UI/UX", "User Interface / User Experience"),
        ("UML", "Unified Modeling Language"),
        ("VIT", "Vellore Institute of Technology"),
        ("VRAM", "Video Random Access Memory"),
        ("WebRTC", "Web Real-Time Communication")
    ]

    abbr_head_st = ParagraphStyle('AbbrHead', fontName='Times-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor("#0F172A"))
    abbr_body_st = ParagraphStyle('AbbrBody', fontName='Times-Roman', fontSize=8.5, leading=11, textColor=colors.HexColor("#1E293B"))

    t_abbr_data = []
    for a, full in abbrs:
        t_abbr_data.append([Paragraph(f"<b>{a}</b>", abbr_head_st), Paragraph(full, abbr_body_st)])

    t_abbr = Table(t_abbr_data, colWidths=[90, 390])
    t_abbr.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 0.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0.5),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, colors.HexColor("#F1F5F9")),
    ]))
    story.append(t_abbr)
    story.append(PageBreak())


def build_symbols_and_notations(story, styles):
    story.append(Spacer(1, 15))
    story.append(Paragraph("SYMBOLS AND NOTATIONS", styles['VITPrelimHeading']))
    story.append(Spacer(1, 10))

    syms = [
        ("W, H", "Width and height spatial dimensions of raw media frame in pixels"),
        ("x_i, y_i", "Normalized bounding box coordinate offsets of localized face bounding box"),
        ("e_i in R^512", "Continuous 512-dimensional normalized facial feature embedding vector"),
        ("||e_i||_2", "L2 Euclidean norm of feature vector constrained to unit length (||e_i|| = 1.0)"),
        ("theta_j", "Geodesic angle between feature vector e_i and class weight vector W_j on hypersphere"),
        ("m", "Additive angular margin penalty parameter in ArcFace (default m = 0.50 radians)"),
        ("s", "Feature hypersphere radius scaling constant in ArcFace (default s = 64.0)"),
        ("L_arc", "ArcFace additive angular margin cross-entropy loss function"),
        ("S_c(u, v)", "Cosine similarity score between unit-normalized feature vectors u and v: u^T * v"),
        ("tau", "Biometric clustering decision acceptance threshold (optimal tau = 0.65)"),
        ("beta", "CLAHE contrast clipping threshold limit for local probability density redistribution"),
        ("c_k", "Multi-angle centroid representation for guest k: c_k = (1/K) * sum(e_{k,j})"),
        ("Delta t_beat", "Inter-beat duration interval in milliseconds: Delta t_beat = 60,000 / BPM"),
        ("BPM", "Tempo cadence of audio track in beats per minute (default BPM = 128)"),
        ("IoU", "Intersection-over-Union spatial overlap ratio used in Non-Maximum Suppression (NMS)"),
        ("TAR @ FAR", "True Accept Rate operating point measured at fixed False Accept Rate (e.g., FAR = 10^-3)"),
        ("E_reel", "Total visual interest energy score of selected photo keyframe in reel synthesis")
    ]

    t_sym_data = []
    for s_sym, s_desc in syms:
        t_sym_data.append([Paragraph(f"<b>{s_sym}</b>", styles['VITTocItemBold']), Paragraph(s_desc, styles['VITTocItem'])])

    t_sym = Table(t_sym_data, colWidths=[90, 390])
    t_sym.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, colors.HexColor("#F1F5F9")),
    ]))
    story.append(t_sym)
    story.append(PageBreak())


def build_abstract(story, styles, page_registry):
    story.append(PageTracker('abstract', page_registry))
    story.append(Spacer(1, 20))
    story.append(Paragraph("ABSTRACT", styles['VITPrelimHeading']))
    story.append(Spacer(1, 14))

    abstract_text = (
        "Modern physical gatherings—ranging from grand weddings, cultural symposiums, and collegiate festivals to global "
        "academic conferences and corporate conventions—generate immense volumes of digital media. Multiple professional "
        "photographers and attendees produce tens of thousands of high-resolution images and videos per event. However, "
        "traditional post-event media dissemination remains fundamentally fractured: event organizers typically dump "
        "unstructured folders onto cloud repositories (such as Google Drive or Dropbox), compelling attendees to spend "
        "hours manually searching through vast, irrelevant photo collections. This manual curation leads to severe attendee "
        "frustration, significant privacy exposure from uncurated public albums, and missed opportunities to celebrate personal moments.<br/><br/>"
        "To resolve these persistent logistical and algorithmic challenges, this project introduces <b>MEMORA</b>, an "
        "end-to-end, high-performance, AI-driven event media discovery and cinematic synthesis platform. Memora eliminates "
        "manual gallery curation through a seamless, zero-install QR-code onboarding workflow. Upon scanning a venue-specific "
        "QR code, guests complete an onboard multi-angle biometric selfie capture. The system processes these reference selfies "
        "using Contrast Limited Adaptive Histogram Equalization (CLAHE) and generates a normalized 512-dimensional centroid "
        "face embedding using an ArcFace deep convolutional network backbone.<br/><br/>"
        "When event photographers upload bulk image batches, Memora's distributed ingestion engine deploys InsightFace "
        "SCRFD with an adaptive multi-scale tiling algorithm. This tiling technique decomposes ultra-high-resolution group "
        "photographs (up to 8K) into overlapping sub-quadrants, successfully detecting distant, small, and occluded faces "
        "exceeding 50 individuals per frame. Extracted face vectors are indexed in a high-speed FAISS vector space utilizing "
        "cosine inner-product metrics, returning matched attendee media within sub-20 millisecond query latencies. "
        "To guarantee 99.9% fault-tolerant delivery in resource-constrained environments, the backend architecture features "
        "an asynchronous Celery/Redis task queue accompanied by a graceful non-blocking multi-threaded fallback mechanism.<br/><br/>"
        "Beyond instant personalized photo discovery, Memora pioneers an <b>Automated Memory Reel Synthesis Engine</b>. "
        "The platform automatically curates a guest's peak visual moments, calculates photo visual interest scores, and "
        "dynamically synchronizes cuts and transitions to procedural Web Audio soundscapes and royalty-free music catalogs "
        "using tempo-aligned beat grids (128 BPM). Cross-platform mobile functionality is delivered through a Capacitor 6 "
        "Android architecture, successfully validated on physical devices including the Oppo Reno 11 5G. Empirical benchmarks "
        "demonstrate a <b>99.63% True Accept Rate (TAR) at 0.001 False Accept Rate (FAR)</b>, reducing photo retrieval time "
        "from several days to under two seconds, establishing an institutional-grade benchmark for event media technology."
    )
    story.append(Paragraph(abstract_text, styles['VITBodyText']))
    
    story.append(Spacer(1, 14))
    story.append(Paragraph("<b>Keywords:</b> Face Recognition, ArcFace, SCRFD, FAISS Vector Search, Event Media Ingestion, Beat-Synchronized Reel Synthesis, Celery Distributed Queue, Mobile Capacitor.", styles['VITBodyText']))
    story.append(PageBreak())
