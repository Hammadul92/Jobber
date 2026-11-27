from contextvars import ContextVar

actor = ContextVar("platform_event_actor", default=None)


class EventActorMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # DRF token authentication runs after Django middleware. The signal
        # also checks the DRF request through this shared Django request.
        token = actor.set(request)
        try:
            return self.get_response(request)
        finally:
            actor.reset(token)
