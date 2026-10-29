"""
Views for operations APIs.
"""

from datetime import timedelta

from django.db import transaction
from django.http import FileResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from taggit.models import Tag

from core.models import (
    Business,
    BusinessEmail,
    Client,
    Invoice,
    Job,
    JobPhoto,
    ServiceQuestionnaire,
    ServiceTermsTemplate,
    TeamMember,
    Service,
    Quote,
)
from core.pricing import business_tax_label, line_items_total, quote_line_items, service_line_items, tax_amount_for
from operations import serializers, paginations, emails
from operations.pdf import build_signed_quote_pdf


def get_active_service_terms_template(service):
    """Return active general terms template for a service, if any."""
    return service.business.service_terms_templates.filter(
        service_name=service.service_name,
        is_active=True,
    ).first()


def create_auto_quote_for_service(service):
    """Create the draft once questionnaire requirements are satisfied or waived."""
    if not service.auto_generate_quote or not (service.bypass_questionnaire or service.filled_questionnaire):
        return
    if service.service_quotes.filter(is_active=True).exclude(status="DECLINED").exists():
        return
    terms_template = get_active_service_terms_template(service)
    if not terms_template:
        raise ValidationError({"service_name": "No active terms and conditions template exists for this service."})
    Quote.objects.create(
        service=service,
        line_items=service_line_items(service),
        currency=service.currency,
        valid_until=timezone.now().date() + timedelta(days=2),
        payment_terms=service.business.default_payment_terms,
        general_terms_conditions=terms_template.content,
        terms_conditions="",
        notes="Auto-generated.",
        status="DRAFT",
    )


def create_auto_invoice_for_service(service):
    """Create an invoice when a service is invoice-eligible."""
    if (
        service.status != "ACTIVE"
        or not service.auto_generate_invoices
        or service.invoices.filter(is_active=True).exists()
    ):
        return None

    quote = (
        service.service_quotes.filter(is_active=True)
        .exclude(status="DECLINED")
        .first()
    )
    if not quote or quote.status != "SIGNED":
        return None

    items = quote_line_items(quote)
    subtotal = line_items_total(items)
    tax_rate = quote.tax_rate if quote.tax_rate is not None else service.business.tax_rate
    tax_amount = tax_amount_for(subtotal, tax_rate)
    return Invoice.objects.create(
        business=service.business,
        client=service.client,
        service=service,
        due_date=None if quote.payment_terms else timezone.now().date() + timedelta(days=2),
        payment_terms=quote.payment_terms,
        currency=quote.currency or service.currency,
        subtotal=subtotal,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total_amount=subtotal + tax_amount,
        line_items=items,
        notes="Auto-generated invoice.",
    )


class BusinessViewSet(viewsets.ModelViewSet):
    """View for manage business APIs."""

    serializer_class = serializers.BusinessSerializer
    queryset = Business.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retrieve businesses for authenticated user."""
        return self.queryset.filter(owner=self.request.user).order_by("-id")

    def perform_create(self, serializer):
        """Assign the owner to the logged-in user."""
        user = self.request.user
        business = serializer.save(owner=user)

        TeamMember.objects.get_or_create(
            business=business,
            employee=user,
        )

        if user.role != "MANAGER":
            user.role = "MANAGER"
            user.save(update_fields=["role"])

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="service-options")
    def service_options(self, request):
        """Return the admin-managed service catalog."""
        options = Tag.objects.order_by("name").values("id", "name", "slug")
        return Response(list(options), status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["get"],
        url_path="marquee-logos",
        authentication_classes=[],
        permission_classes=[AllowAny],
    )
    def marquee_logos(self, request):
        """Return up to 10 active business logos for the public marquee."""
        businesses = (
            Business.objects.filter(
                is_active=True,
                logo__isnull=False,
            )
            .exclude(logo="")
            .order_by("-created_at")[:10]
        )
        serializer = serializers.BusinessMarqueeLogoSerializer(
            businesses,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class ClientViewSet(viewsets.ModelViewSet):
    """View for manage clients APIs."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.ClientSerializer
    queryset = Client.objects.filter(is_active=True).prefetch_related(
        "client_services"
    )
    pagination_class = paginations.ClientPagination

    def get_queryset(self):
        """Retrieve clients for authenticated user."""
        user = self.request.user
        qs = super().get_queryset()

        if user.role == "ADMIN":
            return qs
        if user.role == "MANAGER":
            return qs.filter(business__owner=user).order_by("-id")
        return qs.none()

    def perform_create(self, serializer):
        """Assign business and user to the client for authenticated user."""
        business = Business.objects.filter(owner=self.request.user).first()
        if not business:
            raise ValueError("You must own a business to create a client.")

        user_id = self.request.data.get("user")
        if not user_id:
            raise ValueError("Client must have a user assigned.")

        serializer.save(business=business, user_id=user_id)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class TeamMemberViewSet(viewsets.ModelViewSet):
    """View for manage team member APIs."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = (
        TeamMember.objects.filter(is_active=True)
        .select_related("business", "employee")
        .order_by("-id")
    )
    serializer_class = serializers.TeamMemberSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == "ADMIN":
            return qs
        if user.role == "MANAGER":
            return qs.filter(business__owner=user).order_by("-id")
        return qs.none()

    def perform_create(self, serializer):
        business = serializer.validated_data["business"]
        if self.request.user.role != "ADMIN" and business.owner_id != self.request.user.pk:
            raise PermissionDenied("Only the business owner can add team members.")
        serializer.save()

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class ServiceViewSet(viewsets.ModelViewSet):
    """View for manage services APIs."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.ServiceSerializer

    queryset = (
        Service.objects.filter(is_active=True)
        .select_related("client", "business")
        .order_by("-id")
    )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        prev_filled_questionnaire = instance.filled_questionnaire
        prev_status = instance.status

        response = super().update(request, *args, **kwargs)
        instance.refresh_from_db()

        # Drafts follow service edits until they are sent to a client.
        for draft in instance.service_quotes.filter(status="DRAFT", is_active=True):
            draft.line_items = service_line_items(instance)
            draft.currency = instance.currency
            draft.save(update_fields=["line_items", "currency"])

        # This is idempotent and also repairs a missing draft on later updates.
        create_auto_quote_for_service(instance)

        if not prev_filled_questionnaire and instance.filled_questionnaire:
            emails.send_questionnaire_submitted_email(instance)

        # If status changed to ACTIVE, and auto_generate_invoices is true,
        # and a quote exists and is signed, create invoice
        if (
            prev_status != "ACTIVE"
            and instance.status == "ACTIVE"
            and instance.auto_generate_invoices
        ):
            create_auto_invoice_for_service(instance)

        response.data = self.get_serializer(instance).data
        return response

    @action(detail=True, methods=["post"], url_path="resend-questionnaire")
    def resend_questionnaire(self, request, pk=None):
        """Resend the questionnaire email to the client if not filled."""
        service = self.get_object()
        if service.bypass_questionnaire:
            return Response(
                {"detail": "The questionnaire is bypassed for this service."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Check if questionnaire is already filled
        if service.filled_questionnaire:
            return Response(
                {"detail": "Questionnaire already filled by client."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        questionnaire = service.business.service_questionnaires.filter(
            service_name=service.service_name,
            is_active=True,
        ).first()

        if not questionnaire:
            return Response(
                {"detail": "No active questionnaire found for this service."},
                status=status.HTTP_404_NOT_FOUND,
            )

        emails.send_service_questionnaire_email(
            service=service,
            questionnaire=questionnaire,
        )
        return Response(
            {"detail": "Questionnaire email resent to client."},
            status=status.HTTP_200_OK,
        )

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        client_id = self.request.query_params.get("client")
        if client_id:
            qs = qs.filter(client_id=client_id)

        if user.role == "MANAGER":
            qs = qs.filter(business__owner=user)
        elif user.role == "CLIENT":
            qs = qs.filter(client__user=user)
        elif user.role != "ADMIN":
            qs = qs.none()

        return qs

    def perform_create(self, serializer):
        """Create a service and send a questionnaire when one is required."""
        service = serializer.save()
        create_auto_quote_for_service(service)

        questionnaire = service.business.service_questionnaires.filter(
            service_name=service.service_name,
            is_active=True,
        ).first()

        if questionnaire and not service.bypass_questionnaire:
            emails.send_service_questionnaire_email(
                service=service,
                questionnaire=questionnaire,
            )

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class QuoteViewSet(viewsets.ModelViewSet):
    """View for manage quote APIs."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.QuoteSerializer
    queryset = Quote.objects.filter(is_active=True).select_related("service")

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == "ADMIN":
            return qs
        if user.role == "MANAGER":
            return qs.filter(service__business__owner=user).order_by("-id")
        if user.role == "CLIENT":
            return qs.filter(service__client__user=user).order_by("-id")
        return qs.none()

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)

    def perform_create(self, serializer):
        """Prevent duplicate active quotes for the same service at API level."""
        service = serializer.validated_data["service"]
        if (
            service.service_quotes.filter(is_active=True)
            .exclude(status="DECLINED")
            .exists()
        ):
            raise ValidationError(
                {
                    "service": (
                        "A quote already exists for this service. "
                        "You cannot create another unless the existing one "
                        "is declined or expired."
                    )
                }
            )

        serializer.save()

    @action(detail=True, methods=["get"], url_path="download-pdf")
    def download_pdf(self, request, pk=None):
        """Download the finalized signed quotation as a PDF."""
        quote = self.get_object()
        if quote.status != "SIGNED" or not quote.signature:
            return Response(
                {"detail": "Only signed quotations can be downloaded as PDF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return FileResponse(
            build_signed_quote_pdf(quote),
            as_attachment=True,
            filename=f"{quote.quote_number}-signed.pdf",
            content_type="application/pdf",
        )

    def update(self, request, *args, **kwargs):
        """Prevent updates if quote is already signed."""
        instance = self.get_object()
        if instance.status == "SIGNED":
            return Response(
                {"detail": "Cannot update a signed quote."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="send-quote")
    def send_quote(self, request, pk=None):
        """Send quote details and signing link to the client."""
        quote = self.get_object()
        if quote.status == "SIGNED":
            return Response(
                {"detail": "A signed quote cannot be resent or repriced."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not quote.payment_terms:
            return Response(
                {"payment_terms": ["Choose payment terms before sending this quote."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            if quote.line_items is None:
                quote.line_items = service_line_items(quote.service)
            if not quote.currency:
                quote.currency = quote.service.currency
            quote.tax_rate = quote.service.business.tax_rate
            quote.tax_label = business_tax_label(quote.service.business)
            quote.save(update_fields=["line_items", "currency", "tax_rate", "tax_label"])
            emails.send_quote_email(quote)
            quote.status = "SENT"
            quote.save(update_fields=["status"])
            return Response(
                {"detail": "Quote sent successfully."},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"detail": f"Failed to send quote: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], url_path="sign-quote")
    def sign_quote(self, request, pk=None):
        """Endpoint for client to accept (sign) or decline a quote."""
        user = request.user
        try:
            quote = self.get_object()
        except Quote.DoesNotExist:
            return Response(
                {"detail": "Quote not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if quote.service.client.user != user:
            return Response(
                {"detail": "You are not authorized to sign this quote."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get("status")
        signature = request.data.get("signature")

        if new_status not in ["SIGNED", "DECLINED"]:
            return Response(
                {"detail": "Invalid status. Must be 'SIGNED' or 'DECLINED'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quote.status in ["SIGNED", "DECLINED"]:
            return Response(
                {"detail": f"Quote already {quote.status.lower()}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == "SIGNED":
            if quote.tax_rate is None:
                return Response(
                    {"detail": "This quote predates the tax breakdown. Ask the business to resend it before signing."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if quote.line_items is None:
                quote.line_items = service_line_items(quote.service)
            if not quote.currency:
                quote.currency = quote.service.currency
            if not signature:
                return Response(
                    {"detail": "Signature is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            signature_serializer = self.get_serializer(
                quote, data={"signature": signature}, partial=True,
            )
            signature_serializer.is_valid(raise_exception=True)
            signature = signature_serializer.validated_data["signature"]

            quote.signed_at = timezone.now()
            quote.status = "SIGNED"
            quote.signature = signature

        elif new_status == "DECLINED":
            quote.status = "DECLINED"
            quote.signed_at = timezone.now()
            quote.signature = None

        quote.save(update_fields=["status", "signed_at", "signature", "line_items", "currency"])

        if new_status == "SIGNED":
            create_auto_invoice_for_service(quote.service)
            emails.send_quote_signed_email(quote)
            emails.send_signed_quote_copy_email(quote)

        return Response(
            {"detail": f"Quote successfully {new_status.lower()}."},
            status=status.HTTP_200_OK,
        )


class ServiceQuestionnaireViewSet(viewsets.ModelViewSet):
    """View for manage service questionnaires APIs."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = ServiceQuestionnaire.objects.all().select_related("business")
    serializer_class = serializers.ServiceQuestionnaireSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == "ADMIN":
            return qs
        if user.role == "MANAGER":
            return qs.filter(business__owner=user).order_by("-id")
        if user.role == "CLIENT":
            return qs.filter(business__clients__user=user).order_by("-id")
        return qs.none()

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class ServiceTermsTemplateViewSet(viewsets.ModelViewSet):
    """View for managing service terms template APIs."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = ServiceTermsTemplate.objects.all().select_related("business")
    serializer_class = serializers.ServiceTermsTemplateSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == "ADMIN":
            return qs.order_by("-id")
        if user.role == "MANAGER":
            return qs.filter(business__owner=user).order_by("-id")
        return qs.none()

    def perform_create(self, serializer):
        business = serializer.validated_data["business"]
        user = self.request.user

        if user.role != "ADMIN" and business.owner != user:
            raise PermissionDenied(
                "You do not have permission to manage terms for this business."
            )

        serializer.save()

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class JobViewSet(viewsets.ModelViewSet):
    """ViewSet for managing jobs related to services."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.JobSerializer
    queryset = Job.objects.select_related(
        "service",
        "service__client",
        "service__business",
        "assigned_to",
        "assigned_to__employee",
    ).order_by("-id")

    def get_queryset(self):
        """Filter queryset based on user role and optional query params."""
        user = self.request.user
        qs = super().get_queryset()

        if user.role == "MANAGER":
            qs = qs.filter(service__business__owner=user)
        elif user.role == "CLIENT":
            qs = qs.filter(service__client__user=user)
        elif user.role == "EMPLOYEE":
            qs = qs.filter(assigned_to__employee=user)
        elif user.role != "ADMIN":
            qs = qs.none()

        return qs

    def perform_create(self, serializer):
        """Handle job creation logic."""
        job = serializer.save()
        emails.send_job_created_email(job)
        return job

    def perform_update(self, serializer):
        """Notify the business owner on the first completed transition."""
        previous_status = serializer.instance.status
        job = serializer.save()

        if previous_status != "COMPLETED" and job.status == "COMPLETED":
            if not job.completed_at:
                job.completed_at = timezone.now()
                job.save(update_fields=["completed_at", "updated_at"])
            emails.send_job_completed_email(job)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class JobPhotoViewSet(viewsets.ModelViewSet):
    """ViewSet for managing before/after photos attached to jobs."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.JobPhotoSerializer
    parser_classes = [MultiPartParser, FormParser]
    queryset = JobPhoto.objects.select_related(
        "job",
        "job__service",
        "job__service__client",
        "job__service__business",
        "job__assigned_to",
        "job__assigned_to__employee",
    ).order_by("-uploaded_at")

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        job_id = self.request.query_params.get("job")

        if job_id:
            qs = qs.filter(job_id=job_id)

        if user.role == "MANAGER":
            qs = qs.filter(job__service__business__owner=user)
        elif user.role == "CLIENT":
            qs = qs.filter(job__service__client__user=user)
        elif user.role == "EMPLOYEE":
            qs = qs.filter(job__assigned_to__employee=user)
        elif user.role != "ADMIN":
            qs = qs.none()

        return qs

    def perform_create(self, serializer):
        job_photo = serializer.save()
        job = job_photo.job
        previous_status = job.status

        if job_photo.photo_type == "BEFORE":
            job.status = "IN_PROGRESS"
            job.completed_at = None
            job.save(update_fields=["status", "completed_at", "updated_at"])
        elif job_photo.photo_type == "AFTER":
            job.status = "COMPLETED"
            job.completed_at = timezone.now()
            job.save(update_fields=["status", "completed_at", "updated_at"])
            if previous_status != "COMPLETED":
                emails.send_job_completed_email(job)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class BusinessEmailViewSet(viewsets.ReadOnlyModelViewSet):
    """Only business owners may read archived emails, including login links."""

    queryset = BusinessEmail.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    class HistoryPagination(PageNumberPagination):
        page_size = 25

    pagination_class = HistoryPagination

    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.BusinessEmailDetailSerializer
        return serializers.BusinessEmailSerializer

    def get_queryset(self):
        queryset = self.queryset.filter(business__owner=self.request.user, business__is_deleted=False)
        business_id = self.request.query_params.get("business")
        if business_id:
            if not business_id.isdigit():
                raise ValidationError({"business": "A numeric business ID is required."})
            queryset = queryset.filter(business_id=business_id)
        return queryset

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store"
        return response
