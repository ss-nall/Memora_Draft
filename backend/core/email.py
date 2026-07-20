import logging
import smtplib
from email.message import EmailMessage
from core.config import settings
from typing import Any

logger = logging.getLogger(__name__)

# Beautiful HTML Template
EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<style>
  body {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #09090b;
    color: #e4e4e7;
    margin: 0;
    padding: 20px;
  }}
  .container {{
    max-width: 600px;
    margin: 0 auto;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
    padding: 40px;
    text-align: center;
  }}
  h1 {{
    color: #c084fc;
    margin-bottom: 20px;
  }}
  .button {{
    display: inline-block;
    background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
    color: #ffffff;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-weight: 600;
    margin-top: 30px;
  }}
  .footer {{
    margin-top: 40px;
    font-size: 12px;
    color: #71717a;
  }}
</style>
</head>
<body>
  <div class="container">
    <h1>New Memories Found! 📸</h1>
    <p>Hey there!</p>
    <p>Our AI just scanned a newly uploaded photo for your event and found <strong>YOU</strong> in it!</p>
    <p>Click the button below to jump straight into your personalized gallery and customize your Memory Reel.</p>
    <a href="{link}" class="button">View My Photos</a>
    <div class="footer">
      Powered by Memora AI
    </div>
  </div>
</body>
</html>
"""

def send_match_notification_email(email_to: str, invite_code: str) -> None:
    """
    Sends an email to the guest.
    If SMTP credentials are not configured, it safely falls back to printing the email in the console.
    """
    # Assuming frontend is on localhost:3000 for development or a real domain in production
    # In a real app, you'd put the frontend domain in config.
    frontend_url = "http://localhost:3000" 
    link = f"{frontend_url}/events?code={invite_code}"
    
    html_content = EMAIL_TEMPLATE.format(link=link)

    msg = EmailMessage()
    msg['Subject'] = "Memora: We found new photos of you! 📸"
    msg['From'] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg['To'] = email_to
    msg.set_content("Hey! We found new photos of you. Visit Memora to see them.")
    msg.add_alternative(html_content, subtype='html')

    if not settings.SMTP_SERVER:
        logger.info("\n" + "="*50)
        logger.info(f"MOCK EMAIL MODE - Sending to {email_to}")
        logger.info(f"Subject: {msg['Subject']}")
        logger.info(f"Link: {link}")
        logger.info("="*50 + "\n")
        return

    try:
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email successfully sent to {email_to}")
    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {e}")
