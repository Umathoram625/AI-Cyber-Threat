from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from typing import List, Dict, Any

class PDFService:
    @classmethod
    def generate_threat_report(cls, threats: List[Dict[str, Any]], stats: Dict[str, Any]) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        
        # Define cybersecurity theme colors
        primary_color = colors.HexColor("#0f172a") # dark slate
        secondary_color = colors.HexColor("#06b6d4") # cyan
        accent_color = colors.HexColor("#ef4444") # red
        text_color = colors.HexColor("#334155")
        
        # Modify existing styles to avoid adding duplicate names
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=24,
            leading=28,
            textColor=primary_color,
            spaceAfter=12
        )
        
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=24
        )
        
        heading_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=primary_color,
            spaceBefore=15,
            spaceAfter=10,
            keepWithNext=True
        )
        
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=text_color,
            spaceAfter=8
        )
        
        table_header_style = ParagraphStyle(
            'TableHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=12,
            textColor=colors.white
        )
        
        table_cell_style = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=text_color
        )
        
        table_cell_bold_style = ParagraphStyle(
            'TableCellBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            textColor=primary_color
        )

        story = []
        
        # 1. Header
        story.append(Paragraph("AI Cyber Threat Intelligence Assistant", title_style))
        story.append(Paragraph(f"Executive Threat Intelligence Report — Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
        story.append(Spacer(1, 10))
        
        # 2. Executive Summary Metrics
        story.append(Paragraph("Executive Summary Statistics", heading_style))
        summary_text = (
            f"This intelligence summary assesses active cyber threats and campaign records. "
            f"Currently tracking <b>{stats.get('total_threats', 0)}</b> total threats, of which "
            f"<b>{stats.get('critical_threats', 0)}</b> are classified as Critical Severity, and "
            f"<b>{stats.get('high_threats', 0)}</b> as High Severity. The primary attack vectors detected "
            f"relate to <b>{', '.join(stats.get('top_categories', ['Ransomware', 'Phishing']))}</b>."
        )
        story.append(Paragraph(summary_text, body_style))
        story.append(Spacer(1, 12))
        
        # Stats Table
        stats_data = [
            [
                Paragraph("Metric", table_header_style), 
                Paragraph("Value / Details", table_header_style)
            ],
            [
                Paragraph("Total Monitored Threats", table_cell_bold_style), 
                Paragraph(str(stats.get('total_threats', 0)), table_cell_style)
            ],
            [
                Paragraph("Critical Alerts Active", table_cell_bold_style), 
                Paragraph(str(stats.get('critical_threats', 0)), table_cell_style)
            ],
            [
                Paragraph("High Severity Alerts", table_cell_bold_style), 
                Paragraph(str(stats.get('high_threats', 0)), table_cell_style)
            ],
            [
                Paragraph("Top Targeted Industry", table_cell_bold_style), 
                Paragraph(stats.get('top_industry', 'Finance'), table_cell_style)
            ]
        ]
        
        stats_table = Table(stats_data, colWidths=[180, 360])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#f8fafc"), colors.white])
        ]))
        story.append(stats_table)
        story.append(Spacer(1, 15))
        
        # 3. Main Threat Registry
        story.append(Paragraph("Threat Intelligence Registry (Recent Actions)", heading_style))
        
        registry_data = [
            [
                Paragraph("Published Date", table_header_style),
                Paragraph("Severity", table_header_style),
                Paragraph("Threat Details", table_header_style),
                Paragraph("Risk Score", table_header_style)
            ]
        ]
        
        for threat in threats[:15]: # Limit to top 15 in report
            pub_date = threat.get("published_date")
            if isinstance(pub_date, datetime):
                pub_date_str = pub_date.strftime("%Y-%m-%d")
            else:
                pub_date_str = str(pub_date)[:10]
                
            sev = threat.get("severity", "Medium")
            risk = threat.get("risk_score", 50)
            title = threat.get("title", "Unnamed Threat")
            ttype = threat.get("threat_type", "General")
            
            # Severity color coding
            if sev == "Critical":
                sev_color = "red"
            elif sev == "High":
                sev_color = "orange"
            elif sev == "Medium":
                sev_color = "blue"
            else:
                sev_color = "green"
                
            sev_p = Paragraph(f"<font color='{sev_color}'><b>{sev}</b></font>", table_cell_bold_style)
            details_p = Paragraph(f"<b>{title}</b><br/><font color='#475569'>{ttype}</font>", table_cell_style)
            
            registry_data.append([
                Paragraph(pub_date_str, table_cell_style),
                sev_p,
                details_p,
                Paragraph(f"<b>{risk}/100</b>", table_cell_bold_style)
            ])
            
        registry_table = Table(registry_data, colWidths=[90, 80, 310, 60])
        registry_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#f8fafc"), colors.white])
        ]))
        story.append(registry_table)
        story.append(Spacer(1, 15))
        
        # 4. Global Preventive Recommendations
        story.append(Paragraph("Strategic Preventive Recommendations", heading_style))
        story.append(Paragraph("Based on active threats collected, security teams should implement these baseline controls:", body_style))
        
        recs = [
            "<b>Patch Public Interfaces</b>: Prioritize CVE mitigation for external VPN, application proxy, and firewall controllers.",
            "<b>Backups and Segregations</b>: Validate daily backup success, isolation of backup storage pools, and recovery protocols.",
            "<b>Identity Auditing</b>: Review administrator login logs for credential stuffing spikes and enforce MFA protocols systemwide.",
            "<b>Threat Detection</b>: Deploy advanced detection signatures (MITRE mapped) to track initial vectors and prevent command shell execution."
        ]
        
        for rec in recs:
            story.append(Paragraph(f"• {rec}", body_style))
            
        # Build Document
        doc.build(story)
        buffer.seek(0)
        return buffer
