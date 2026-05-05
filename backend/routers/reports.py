from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from io import BytesIO
from datetime import datetime

from database import get_db
import models
from routers.auth import get_current_user
from utils.authz import user_can_access_project

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame
from reportlab.pdfgen import canvas as pdfcanvas

router = APIRouter(prefix="/reports", tags=["Reports"])

# ── Palette Entreprise ──────────────────────────────────────────────────────
NAVY      = colors.HexColor('#0F2044')
NAVY_MID  = colors.HexColor('#1E3A6E')
BLUE_ACC  = colors.HexColor('#2563EB')
SILVER    = colors.HexColor('#F1F5F9')
WHITE     = colors.white
BLACK     = colors.HexColor('#111827')
GRAY_TXT  = colors.HexColor('#6B7280')
BORDER    = colors.HexColor('#CBD5E1')

DONE_C    = colors.HexColor('#059669')
PROG_C    = colors.HexColor('#2563EB')
BLOC_C    = colors.HexColor('#DC2626')
TODO_C    = colors.HexColor('#6B7280')
HIGH_C    = colors.HexColor('#DC2626')
MED_C     = colors.HexColor('#D97706')
LOW_C     = colors.HexColor('#059669')

W, H = A4


def prio_hex(p):
    return {
        'High': '#DC2626',
        'Medium': '#D97706',
        'Low': '#059669'
    }.get(p, '#6B7280')


def status_hex(s):
    return {
        'Done': '#059669',
        'In Progress': '#2563EB',
        'Blocked': '#DC2626',
        'To Do': '#6B7280'
    }.get(s, '#6B7280')


# ── Page Canvas (header/footer bands on every page) ────────────────────────
class ReportCanvas(pdfcanvas.Canvas):
    def __init__(self, *args, project_name="Projet", **kwargs):
        super().__init__(*args, **kwargs)
        self._project_name = project_name
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved_page_states)
        for i, state in enumerate(self._saved_page_states, start=1):
            self.__dict__.update(state)
            self._draw_page(i, total)
            pdfcanvas.Canvas.showPage(self)
        pdfcanvas.Canvas.save(self)

    def _draw_page(self, page_num, total):
        w, h = A4
        # ── Top navy band ──
        self.setFillColor(NAVY)
        self.rect(0, h - 2*cm, w, 2*cm, fill=1, stroke=0)
        self.setFillColor(WHITE)
        self.setFont("Helvetica-Bold", 13)
        self.drawString(1.8*cm, h - 1.35*cm, "ValaFlow")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor('#94A3B8'))
        self.drawRightString(w - 1.8*cm, h - 1.35*cm, f"Rapport Confidentiel | {self._project_name}")

        # ── Thin blue accent line under header ──
        self.setStrokeColor(BLUE_ACC)
        self.setLineWidth(2)
        self.line(0, h - 2*cm, w, h - 2*cm)

        # ── Bottom footer band ──
        self.setFillColor(NAVY)
        self.rect(0, 0, w, 1.2*cm, fill=1, stroke=0)
        self.setFillColor(colors.HexColor('#94A3B8'))
        self.setFont("Helvetica", 7.5)
        self.drawString(1.8*cm, 0.42*cm, f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}")
        self.drawRightString(w - 1.8*cm, 0.42*cm, f"Page {page_num} / {total}")


@router.get("/project/{project_id}/pdf")
def generate_project_report(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")

    if not user_can_access_project(db, current_user, project_id):
        raise HTTPException(status_code=403, detail="Accès refusé à ce projet")

    tasks = (
        db.query(models.Task)
        .options(joinedload(models.Task.assignee))
        .filter(models.Task.project_id == project_id)
        .order_by(models.Task.created_at.asc())
        .all()
    )

    total    = len(tasks)
    done     = sum(1 for t in tasks if t.statut == 'Done')
    in_prog  = sum(1 for t in tasks if t.statut == 'In Progress')
    blocked  = sum(1 for t in tasks if t.statut == 'Blocked')
    todo     = sum(1 for t in tasks if t.statut == 'To Do')
    pct      = round(done / total * 100) if total else 0

    members = {}
    for t in tasks:
        if t.assignee:
            members[t.assignee.id] = t.assignee.nom

    # ── Build PDF ────────────────────────────────────────────────────────────
    buffer = BytesIO()

    def make_canvas(*args, **kwargs):
        return ReportCanvas(*args, project_name=project.nom, **kwargs)

    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=1.8*cm, leftMargin=1.8*cm,
        topMargin=2.8*cm, bottomMargin=1.8*cm,
        title=f"Rapport - {project.nom}"
    )

    sty = getSampleStyleSheet()

    def PS(name, **kw):
        base = kw.pop('parent', sty['Normal'])
        return ParagraphStyle(name, parent=base, **kw)

    section_title = PS('sec', fontSize=12, fontName='Helvetica-Bold',
                        textColor=NAVY, spaceBefore=18, spaceAfter=8)
    body          = PS('body', fontSize=9.5, fontName='Helvetica',
                        textColor=BLACK, leading=15)
    small_gray    = PS('sg', fontSize=8, fontName='Helvetica', textColor=GRAY_TXT)
    label_cell    = PS('lc', fontSize=9, fontName='Helvetica-Bold', textColor=NAVY_MID)
    value_cell    = PS('vc', fontSize=9, fontName='Helvetica', textColor=BLACK)
    tbl_header    = PS('th', fontSize=9, fontName='Helvetica-Bold', textColor=WHITE)
    tbl_cell      = PS('tc', fontSize=8.5, fontName='Helvetica', textColor=BLACK, leading=13)
    tbl_cell_bold = PS('tcb', fontSize=8.5, fontName='Helvetica-Bold', textColor=BLACK)

    def section_bar(title):
        """Navy left-border section header."""
        data = [[Paragraph(title, PS('sb', fontSize=11, fontName='Helvetica-Bold',
                                      textColor=WHITE))]]
        t = Table(data, colWidths=[doc.width])
        t.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,-1), NAVY_MID),
            ('TOPPADDING',    (0,0), (-1,-1), 7),
            ('BOTTOMPADDING', (0,0), (-1,-1), 7),
            ('LEFTPADDING',   (0,0), (-1,-1), 12),
            ('RIGHTPADDING',  (0,0), (-1,-1), 12),
        ]))
        return t

    def kpi_card(value, label, color):
        d = [[
            Paragraph(f'<font size="20" color="{color.hexval() if hasattr(color,"hexval") else color}"><b>{value}</b></font>', sty['Normal']),
        ],[
            Paragraph(label, PS('klbl', fontSize=7.5, fontName='Helvetica', textColor=GRAY_TXT, alignment=TA_CENTER)),
        ]]
        t = Table(d, colWidths=[3.2*cm])
        t.setStyle(TableStyle([
            ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
            ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING',    (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('BACKGROUND',    (0,0), (-1,-1), WHITE),
            ('BOX',           (0,0), (-1,-1), 0.5, BORDER),
        ]))
        return t

    story = []

    # ── PROJECT TITLE BLOCK ─────────────────────────────────────────────────
    story.append(Spacer(1, 4))
    title_data = [[
        Paragraph(f'<font size="20" color="#0F2044"><b>{project.nom}</b></font>', sty['Normal']),
        Paragraph(
            f'<font size="9" color="#6B7280">Statut : </font>'
            f'<font size="9" color="#2563EB"><b>{project.statut.upper()}</b></font>',
            PS('sr', fontSize=9, alignment=TA_RIGHT)
        )
    ]]
    title_t = Table(title_data, colWidths=[doc.width * 0.7, doc.width * 0.3])
    title_t.setStyle(TableStyle([
        ('VALIGN',        (0,0), (-1,-1), 'BOTTOM'),
        ('TOPPADDING',    (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(title_t)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=2, color=BLUE_ACC, spaceAfter=14))

    # ── PROJECT INFO TABLE ──────────────────────────────────────────────────
    story.append(section_bar("📋  Informations du Projet"))
    story.append(Spacer(1, 8))

    def fmt_date(d):
        return d.strftime('%d %B %Y') if d else 'Non renseignée'

    info_rows = [
        [Paragraph('Nom du projet',  label_cell), Paragraph(project.nom, value_cell)],
        [Paragraph('Statut',         label_cell), Paragraph(project.statut.capitalize(), value_cell)],
        [Paragraph('Description',    label_cell), Paragraph(project.description or 'Aucune description', value_cell)],
        [Paragraph('Date de début',  label_cell), Paragraph(fmt_date(project.date_debut), value_cell)],
        [Paragraph('Date de fin',    label_cell), Paragraph(fmt_date(project.date_fin), value_cell)],
        [Paragraph('Membres assignés', label_cell), Paragraph(', '.join(members.values()) if members else 'Aucun membre', value_cell)],
    ]

    info_t = Table(info_rows, colWidths=[4*cm, doc.width - 4*cm])
    info_t.setStyle(TableStyle([
        ('FONTSIZE',      (0,0), (-1,-1), 9),
        ('ROWBACKGROUNDS',(0,0), (-1,-1), [WHITE, SILVER]),
        ('TOPPADDING',    (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING',   (0,0), (-1,-1), 10),
        ('RIGHTPADDING',  (0,0), (-1,-1), 10),
        ('GRID',          (0,0), (-1,-1), 0.4, BORDER),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(info_t)
    story.append(Spacer(1, 18))

    # ── KPI CARDS ───────────────────────────────────────────────────────────
    story.append(section_bar("📊  Statistiques Globales"))
    story.append(Spacer(1, 10))

    kpi_values = [
        (str(total),  "Total tâches",  BLACK),
        (str(done),   "Terminées",     DONE_C),
        (str(in_prog),"En cours",      PROG_C),
        (str(blocked),"Bloquées",      BLOC_C),
        (str(todo),   "À faire",       TODO_C),
        (f"{pct}%",   "Avancement",    BLUE_ACC),
    ]

    def kpi_cell(val, lbl, col):
        inner = [
            [Paragraph(f'<b>{val}</b>',
                       PS('kv', fontSize=22, fontName='Helvetica-Bold',
                          textColor=col, alignment=TA_CENTER))],
            [Paragraph(lbl, PS('kl', fontSize=7.5, fontName='Helvetica',
                               textColor=GRAY_TXT, alignment=TA_CENTER))],
        ]
        t = Table(inner, colWidths=[(doc.width - 5*mm) / 6])
        t.setStyle(TableStyle([
            ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
            ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING',    (0,0), (-1,-1), 12),
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
            ('BACKGROUND',    (0,0), (-1,-1), WHITE),
            ('BOX',           (0,0), (-1,-1), 0.5, BORDER),
        ]))
        return t

    kpi_row = [[kpi_cell(v, l, c) for v, l, c in kpi_values]]
    kpi_t = Table(kpi_row, colWidths=[(doc.width - 5*mm) / 6] * 6)
    kpi_t.setStyle(TableStyle([
        ('LEFTPADDING',  (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING',   (0,0), (-1,-1), 0),
        ('BOTTOMPADDING',(0,0), (-1,-1), 0),
    ]))
    story.append(kpi_t)
    story.append(Spacer(1, 18))

    # ── TASKS TABLE ─────────────────────────────────────────────────────────
    story.append(section_bar("📝  Liste Détaillée des Tâches"))
    story.append(Spacer(1, 8))

    col_w = [6.2*cm, 2.2*cm, 2.6*cm, 3.2*cm, 2.4*cm]
    headers = ["Nom de la tâche", "Priorité", "Statut", "Assignée à", "Deadline"]
    task_data = [[Paragraph(h, tbl_header) for h in headers]]

    for t in tasks:
        p_hex = prio_hex(t.priority)
        s_hex = status_hex(t.statut)
        dl = t.deadline.strftime('%d/%m/%Y') if t.deadline else '—'
        assignee = t.assignee.nom if t.assignee else '—'
        task_data.append([
            Paragraph(t.nom, tbl_cell),
            Paragraph(f'<font color="{p_hex}"><b>{t.priority}</b></font>', tbl_cell_bold),
            Paragraph(f'<font color="{s_hex}"><b>{t.statut}</b></font>', tbl_cell_bold),
            Paragraph(assignee, tbl_cell),
            Paragraph(dl, PS('dl', fontSize=8.5, fontName='Helvetica', textColor=GRAY_TXT)),
        ])

    task_t = Table(task_data, colWidths=col_w, repeatRows=1, hAlign='LEFT')
    task_t.setStyle(TableStyle([
        # Header
        ('BACKGROUND',    (0,0), (-1,0), NAVY),
        ('TEXTCOLOR',     (0,0), (-1,0), WHITE),
        ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',      (0,0), (-1,0), 9),
        ('TOPPADDING',    (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 9),
        # Rows
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, SILVER]),
        ('FONTSIZE',      (0,1), (-1,-1), 8.5),
        ('TOPPADDING',    (0,1), (-1,-1), 7),
        ('BOTTOMPADDING', (0,1), (-1,-1), 7),
        # Grid
        ('GRID',          (0,0), (-1,-1), 0.4, BORDER),
        ('LINEBELOW',     (0,0), (-1,0), 1.5, NAVY_MID),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING',   (0,0), (-1,-1), 8),
        ('RIGHTPADDING',  (0,0), (-1,-1), 8),
    ]))
    story.append(task_t)
    story.append(Spacer(1, 20))

    # ── SIGNATURE BLOCK ─────────────────────────────────────────────────────
    sig_data = [[
        Paragraph('Validé par', PS('sv', fontSize=8, fontName='Helvetica', textColor=GRAY_TXT, alignment=TA_CENTER)),
        Paragraph('Date', PS('sv2', fontSize=8, fontName='Helvetica', textColor=GRAY_TXT, alignment=TA_CENTER)),
    ]]
    sig_t = Table(sig_data, colWidths=[doc.width / 2] * 2)
    sig_t.setStyle(TableStyle([
        ('BOX',           (0,0), (-1,-1), 0.5, BORDER),
        ('INNERGRID',     (0,0), (-1,-1), 0.5, BORDER),
        ('TOPPADDING',    (0,0), (-1,-1), 22),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND',    (0,0), (-1,-1), SILVER),
    ]))
    story.append(KeepTogether([
        Paragraph("Approbation", PS('ap', fontSize=9, fontName='Helvetica-Bold', textColor=NAVY, spaceAfter=6)),
        sig_t,
    ]))

    # ── Build ────────────────────────────────────────────────────────────────
    doc.build(story, canvasmaker=make_canvas)
    buffer.seek(0)

    safe_name = project.nom.replace(' ', '_').replace('/', '-')
    from urllib.parse import quote
    filename = f"rapport_{safe_name}_{datetime.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"}
    )
