"""Payment stub for paid mentorship sessions (req #2b).

A real integration (Razorpay/Stripe) would create an order here and confirm via
webhook. For the MVP we compute the amount and mark a mock payment intent.
"""
from dataclasses import dataclass

from app.models.mentorship import MentorProfile


@dataclass
class PaymentIntent:
    amount: float
    currency: str
    reference: str
    status: str


def compute_session_amount(mentor: MentorProfile, duration_minutes: int) -> float:
    """Industry-standard hourly rate, pro-rated by duration."""
    return round((mentor.hourly_rate or 0.0) * (duration_minutes / 60.0), 2)


def create_payment_intent(amount: float, session_id: int) -> PaymentIntent:
    return PaymentIntent(
        amount=amount,
        currency="INR",
        reference=f"mock_pi_{session_id}",
        status="pending",
    )
