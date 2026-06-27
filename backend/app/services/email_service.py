"""Email delivery service.

In dev (or when SMTP is unavailable) emails are logged to stdout instead of
sent, so the app runs with zero external dependencies. Templates live in
``app/templates/email``.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger("connectx.email")

_TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates" / "email"
_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATE_DIR)),
    autoescape=select_autoescape(["html"]),
)


def render(template_name: str, **context) -> str:
    return _env.get_template(template_name).render(**context)


def send_email(to: str, subject: str, html_body: str) -> None:
    """Send an HTML email.

    Uses STARTTLS + login when ``SMTP_STARTTLS`` / credentials are configured
    (e.g. Gmail on port 587). Falls back to logging if SMTP is unreachable so
    the app never crashes on a mail failure.
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            if settings.SMTP_STARTTLS:
                server.starttls()
                server.ehlo()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("Email sent to %s: %s", to, subject)
    except Exception as exc:  # pragma: no cover - dev fallback
        logger.warning(
            "SMTP send failed (%s); logging email instead.\nTO: %s\nSUBJECT: %s",
            exc, to, subject,
        )
