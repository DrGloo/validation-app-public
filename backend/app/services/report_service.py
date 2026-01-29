"""Service for building screenshot reports (HTML/PDF)."""
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape


class ReportService:
    """Builds report content from screenshot data. No database access."""

    def __init__(self, template_dir: str | Path | None = None):
        """Initialize with optional template directory."""
        if template_dir is None:
            template_dir = Path(__file__).resolve().parent.parent / "templates"
        self.template_dir = Path(template_dir)
        self._env = Environment(
            loader=FileSystemLoader(str(self.template_dir)),
            autoescape=select_autoescape(["html", "xml"]),
        )

    def build_report_context(
        self,
        screenshots: List[Dict[str, Any]],
        filter_summary: str,
        summary_stats: Dict[str, Any],
        title: str = "Screenshot Validation Report",
    ) -> Dict[str, Any]:
        """Build context dict for the report template."""
        generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        return {
            "title": title,
            "generated_at": generated_at,
            "filter_summary": filter_summary,
            "total": summary_stats.get("total", 0),
            "successful": summary_stats.get("successful", 0),
            "failed": summary_stats.get("failed", 0),
            "success_rate": summary_stats.get("success_rate", 0.0),
            "screenshots": screenshots,
        }

    def render_html(self, context: Dict[str, Any]) -> str:
        """Render the report template to HTML string."""
        template = self._env.get_template("report.html")
        return template.render(**context)
