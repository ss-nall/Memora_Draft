"""
Typography and Document Styles for BCSE497J Project-I Report
Strict adherence to Times New Roman, 1.15 line spacing, standard university font scales.
"""
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib import colors

def setup_document_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='VITReportTitle',
        fontName='Times-Bold',
        fontSize=18,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=14
    ))
    styles.add(ParagraphStyle(
        name='VITReportSubtitle',
        fontName='Times-Bold',
        fontSize=13,
        leading=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1E3A8A"),
        spaceAfter=18
    ))
    styles.add(ParagraphStyle(
        name='VITPrelimHeading',
        fontName='Times-Bold',
        fontSize=16,
        leading=22,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=14,
        spaceAfter=14,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        name='VITChapterHeading',
        fontName='Times-Bold',
        fontSize=15,
        leading=20,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        name='VITSectionHeading',
        fontName='Times-Bold',
        fontSize=12,
        leading=16,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        name='VITSubSectionHeading',
        fontName='Times-Bold',
        fontSize=10.5,
        leading=14,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#334155"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        name='VITBodyText',
        fontName='Times-Roman',
        fontSize=11,
        leading=15.5,  # 1.15 line spacing equivalent
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=8
    ))
    styles.add(ParagraphStyle(
        name='VITBodyTextIndent',
        fontName='Times-Roman',
        fontSize=11,
        leading=15.5,
        alignment=TA_JUSTIFY,
        firstLineIndent=18,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=8
    ))
    styles.add(ParagraphStyle(
        name='VITBulletText',
        fontName='Times-Roman',
        fontSize=10.5,
        leading=15,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor("#1E293B"),
        leftIndent=15,
        spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        name='VITCaptionText',
        fontName='Times-Italic',
        fontSize=9.5,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#475569"),
        spaceBefore=5,
        spaceAfter=10
    ))
    styles.add(ParagraphStyle(
        name='VITTableCaption',
        fontName='Times-Bold',
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=10,
        spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        name='VITCodeSnippet',
        fontName='Courier',
        fontSize=8,
        leading=11,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=3,
        spaceAfter=3
    ))
    styles.add(ParagraphStyle(
        name='VITFormulaBox',
        fontName='Times-Italic',
        fontSize=11,
        leading=16,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=6,
        spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        name='VITTocItem',
        fontName='Times-Roman',
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#1E293B")
    ))
    styles.add(ParagraphStyle(
        name='VITTocItemBold',
        fontName='Times-Bold',
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#0F172A")
    ))
    styles.add(ParagraphStyle(
        name='VITTocPage',
        fontName='Times-Roman',
        fontSize=10,
        leading=14,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#1E293B")
    ))
    styles.add(ParagraphStyle(
        name='VITCalloutText',
        fontName='Times-Roman',
        fontSize=10,
        leading=14,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor("#1E3A8A")
    ))
    styles.add(ParagraphStyle(
        name='VITTableHead',
        fontName='Times-Bold',
        fontSize=7.5,
        leading=9.5,
        alignment=TA_LEFT,
        textColor=colors.white
    ))
    styles.add(ParagraphStyle(
        name='VITTableHeadCenter',
        fontName='Times-Bold',
        fontSize=7.5,
        leading=9.5,
        alignment=TA_CENTER,
        textColor=colors.white
    ))
    styles.add(ParagraphStyle(
        name='VITTableBody',
        fontName='Times-Roman',
        fontSize=7.5,
        leading=9.5,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#1E293B")
    ))
    styles.add(ParagraphStyle(
        name='VITTableBodyBold',
        fontName='Times-Bold',
        fontSize=7.5,
        leading=9.5,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#0F172A")
    ))
    styles.add(ParagraphStyle(
        name='VITTableBodyCenter',
        fontName='Times-Roman',
        fontSize=7.5,
        leading=9.5,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1E293B")
    ))
    styles.add(ParagraphStyle(
        name='VITTableBodyCode',
        fontName='Courier',
        fontSize=6.5,
        leading=8.5,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#0F172A")
    ))

    return styles

def wrap_table_data(raw_data, head_style, body_style, bold_first_col=False):
    """Wraps every cell in raw_data into a ReportLab Paragraph to guarantee proper text wrapping and prevent overlaps"""
    from reportlab.platypus import Paragraph
    wrapped = []
    for row_idx, row in enumerate(raw_data):
        wrapped_row = []
        is_header = (row_idx == 0)
        for col_idx, cell in enumerate(row):
            if isinstance(cell, Paragraph):
                wrapped_row.append(cell)
            else:
                cell_str = str(cell)
                if is_header:
                    wrapped_row.append(Paragraph(cell_str, head_style))
                else:
                    if bold_first_col and col_idx == 0:
                        wrapped_row.append(Paragraph(f"<b>{cell_str}</b>", body_style))
                    else:
                        wrapped_row.append(Paragraph(cell_str, body_style))
        wrapped.append(wrapped_row)
    return wrapped

