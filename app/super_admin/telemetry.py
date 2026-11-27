"""Best-effort integration telemetry; never block the underlying operation."""

import logging

logger = logging.getLogger(__name__)


def system_event(entity, operation, summary):
    from .models import PlatformEvent

    try:
        PlatformEvent.objects.create(
            entity=entity, entity_id=0, operation=operation, summary=summary
        )
    except Exception:
        logger.exception("Unable to record integration telemetry")
