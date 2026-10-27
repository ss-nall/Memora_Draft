"""
Canvas and Page Tracking for BCSE497J Project-I Report
"""
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import Flowable

def to_roman(n):
    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syb = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i']
    roman_num = ''
    i = 0
    while n > 0:
        for _ in range(n // val[i]):
            roman_num += syb[i]
            n -= val[i]
        i += 1
    return roman_num

class PageTracker(Flowable):
    def __init__(self, key, registry):
        super().__init__()
        self.key = key
        self.registry = registry

    def draw(self):
        self.registry[self.key] = self.canv._pageNumber

class VITReportCanvas(canvas.Canvas):
    first_chapter_page = 9  # Fallback

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self.pages)
        for page in self.pages:
            self.__dict__.update(page)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, total_pages):
        page_num = self._pageNumber
        self.saveState()

        # Page 1 is Cover Page: strictly no header or footer
        if page_num == 1:
            self.restoreState()
            return

        # Preliminary Pages (2 to first_chapter_page - 1)
        if page_num < VITReportCanvas.first_chapter_page:
            roman_str = to_roman(page_num - 1)
            self.setFont("Times-Roman", 10)
            self.setFillColor(colors.HexColor("#222222"))
            self.drawCentredString(A4[0] / 2.0, 32, roman_str)
            self.setStrokeColor(colors.HexColor("#D0D0D0"))
            self.setLineWidth(0.5)
            self.line(54, 46, A4[0] - 54, 46)
        else:
            # Chapter Pages
            chapter_page_num = page_num - VITReportCanvas.first_chapter_page + 1

            # Running Header
            self.setFont("Times-Italic", 9)
            self.setFillColor(colors.HexColor("#444444"))
            self.drawString(54, A4[1] - 38, "BCSE497J Project-I: MEMORA Event Media Discovery Platform")
            self.drawRightString(A4[0] - 54, A4[1] - 38, "VIT Vellore - SCOPE")

            self.setStrokeColor(colors.HexColor("#888888"))
            self.setLineWidth(0.6)
            self.line(54, A4[1] - 44, A4[0] - 54, A4[1] - 44)

            # Running Footer
            self.setFont("Times-Roman", 10)
            self.setFillColor(colors.HexColor("#222222"))
            self.drawCentredString(A4[0] / 2.0, 32, str(chapter_page_num))

            self.setStrokeColor(colors.HexColor("#D0D0D0"))
            self.setLineWidth(0.5)
            self.line(54, 46, A4[0] - 54, 46)

        self.restoreState()
