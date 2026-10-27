"""
BCSE497J Project-I Final Report Master Orchestrator
Generates: docs/BCSE497J_Memora_Final_Project_Report.pdf
University Standard: Vellore Institute of Technology (VIT), SCOPE
"""
import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate
from report_builder.styles import setup_document_styles
from report_builder.canvas import VITReportCanvas
from report_builder.preliminary import (
    build_cover_page, build_declaration, build_certificate,
    build_acknowledgements, build_table_of_contents,
    build_list_of_figures, build_list_of_tables,
    build_list_of_abbreviations, build_symbols_and_notations,
    build_abstract
)
from report_builder.chapters_1_4 import (
    build_chapter_1, build_chapter_2, build_chapter_3, build_chapter_4
)
from report_builder.chapters_5_8 import (
    build_chapter_5, build_chapter_6, build_chapter_7, build_chapter_8
)
from report_builder.references_appendix import (
    build_chapter_9_references, build_appendix_a
)

def build_full_story(styles, page_registry):
    story = []

    # Preliminary Pages (Cover, i to x)
    build_cover_page(story, styles)
    build_declaration(story, styles)
    build_certificate(story, styles)
    build_acknowledgements(story, styles)
    build_table_of_contents(story, styles, page_registry)
    build_list_of_figures(story, styles, page_registry)
    build_list_of_tables(story, styles, page_registry)
    build_list_of_abbreviations(story, styles)
    build_symbols_and_notations(story, styles)
    build_abstract(story, styles, page_registry)

    # Main Chapters
    build_chapter_1(story, styles, page_registry)
    build_chapter_2(story, styles, page_registry)
    build_chapter_3(story, styles, page_registry)
    build_chapter_4(story, styles, page_registry)
    build_chapter_5(story, styles, page_registry)
    build_chapter_6(story, styles, page_registry)
    build_chapter_7(story, styles, page_registry)
    build_chapter_8(story, styles, page_registry)

    # References & Appendix
    build_chapter_9_references(story, styles, page_registry)
    build_appendix_a(story, styles, page_registry)

    return story

def generate_pdf(output_path):
    print("Initializing document styles and layout...")
    styles = setup_document_styles()

    # Pass 1: Measure exact page numbers for all sections and figures
    print("Executing Pass 1: Recording dynamic page registry...")
    page_registry = {}
    pass1_target = "pass1_temp.pdf"
    doc_pass1 = SimpleDocTemplate(
        pass1_target,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    story_pass1 = build_full_story(styles, page_registry)
    doc_pass1.build(story_pass1, canvasmaker=VITReportCanvas)

    first_ch_page = page_registry.get('ch1', 9)
    VITReportCanvas.first_chapter_page = first_ch_page
    print(f"Pass 1 Completed! First chapter starts on absolute page {first_ch_page}.")
    print(f"Tracked {len(page_registry)} section anchors: {page_registry}")

    # Remove temporary pass 1 artifact
    if os.path.exists(pass1_target):
        try:
            os.remove(pass1_target)
        except Exception:
            pass

    # Pass 2: Compile final publication report with exact TOC and pagination
    print(f"Executing Pass 2: Generating final report at {output_path}...")
    doc_final = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    story_final = build_full_story(styles, page_registry)
    doc_final.build(story_final, canvasmaker=VITReportCanvas)

    print(f"SUCCESS: University Standard Final Report successfully generated at {output_path}")

if __name__ == "__main__":
    os.makedirs("docs", exist_ok=True)
    target_file = os.path.join("docs", "BCSE497J_Memora_Final_Project_Report.pdf")
    generate_pdf(target_file)
