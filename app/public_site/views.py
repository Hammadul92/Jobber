from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.generic import TemplateView

from core.models import Business, FAQ


PUBLIC_PAGE_METADATA = {
    "for-service-businesses": (
        "Service Business Management Software for Contractors",
        "Manage clients, services, team members, questionnaires, jobs, "
        "quotes, invoices, and payouts from one organized "
        "service-business workspace.",
    ),
    "features": (
        "Service Business Software Features",
        "Explore GetContractorz features for managing clients, services, "
        "questionnaires, team jobs, work images, quotes, invoices, payouts, "
        "and business information.",
    ),
    "how-it-works": (
        "How GetContractorz Works for Service Businesses",
        "See how GetContractorz works for service-business Managers, invited "
        "Clients, Employees, and Marketplace visitors from registration "
        "through job completion.",
    ),
    "for-clients": (
        "GetContractorz for Clients | Invitations, Services, Quotes & Invoices",
        "Learn why you may receive a GetContractorz invitation, how service "
        "questionnaires and magic links work, and what client information "
        "you can access.",
    ),
    "service-categories": (
        "Service Business Software by Industry",
        "Explore the service-business categories currently supported by "
        "GetContractorz and find the right path to business registration or "
        "Marketplace discovery.",
    ),
    "about": (
        "About GetContractorz | Service Business Management Platform",
        "Learn what GetContractorz is built to organize, how the Marketplace "
        "fits the platform, and the principles guiding its public product "
        "experience.",
    ),
    "industries": (
        "Service Business Management Software for 50+ Industries",
        "GetContractorz helps home service businesses manage clients, "
        "questionnaires, quotations, jobs, invoices, Stripe payments, and teams.",
    ),
    "services": (
        "Service Business Management Software Features",
        "Explore GetContractorz features for client management, service "
        "questionnaires, quotations, job management, team access, invoices, "
        "Stripe payments, and client workspaces.",
    ),
    "team": (
        "GetContractorz Team",
        "Meet the Calgary team building service business management software "
        "for client intake, quotations, job management, invoicing, payments, "
        "and connected service records.",
    ),
    "terms-and-conditions": (
        "Terms and Conditions",
        "Terms governing use of the GetContractorz platform.",
    ),
    "privacy-policy": (
        "Privacy Policy",
        "How GetContractorz collects, uses, shares, retains, and protects "
        "personal information across its service-business platform.",
    ),
}


def _business_location_label(business):
    return ", ".join(
        part
        for part in [business.city, business.province_state, business.country]
        if part
    ) or "-"


def _business_contact_href(business):
    if business.email:
        return f"mailto:{business.email}"
    if business.phone:
        return f"tel:{business.phone}"
    if business.website:
        return business.website
    return ""


def _business_public_data(business):
    service_names = list(business.services_offered.names())
    primary_category = service_names[0] if service_names else "-"
    additional_categories = service_names[1:]
    initials = "".join(part[0] for part in business.name.split()[:2]).upper() or "-"
    return {
        "business": business,
        "name": business.name or "-",
        "primary_category": primary_category,
        "additional_categories": additional_categories,
        "service_categories": service_names,
        "location": _business_location_label(business),
        "description": business.business_description or "-",
        "phone": business.phone or "-",
        "email": business.email or "-",
        "website": business.website or "-",
        "logo": business.logo.url if business.logo else "",
        "initials": initials,
        "contact_href": _business_contact_href(business),
    }


def home(request):
    return render(
        request,
        "public_site/home.html",
        {
            "meta_title": "Service Business Management Software | GetContractorz",
            "meta_description": (
                "Organize clients, services, team members, jobs, quotes, "
                "invoices, and more in one service-business workspace. Get "
                "started free with GetContractorz."
            ),
        },
    )


def marketplace(request):
    businesses = (
        Business.objects.filter(is_active=True)
        .select_related("owner")
        .prefetch_related("services_offered")
        .order_by("name")
    )
    query = request.GET.get("q", "").strip()
    category = request.GET.get("category", "").strip()
    location = request.GET.get("location", "").strip()

    active_businesses = list(businesses)
    category_options = sorted(
        {
            service.name
            for business in active_businesses
            for service in business.services_offered.all()
            if service.name
        }
    )
    location_options = sorted(
        {
            ", ".join(
                part
                for part in [business.city, business.province_state, business.country]
                if part
            )
            for business in active_businesses
            if any([business.city, business.province_state, business.country])
        }
    )

    if query:
        businesses = businesses.filter(
            Q(name__icontains=query)
            | Q(business_description__icontains=query)
            | Q(services_offered__name__icontains=query)
        ).distinct()
    if category:
        businesses = businesses.filter(services_offered__name=category).distinct()
    if location:
        businesses = [
            business
            for business in businesses
            if ", ".join(
                part
                for part in [business.city, business.province_state, business.country]
                if part
            )
            == location
        ]

    business_cards = []
    for business in businesses:
        business_cards.append(_business_public_data(business))

    return render(
        request,
        "public_site/marketplace.html",
        {
            "businesses": business_cards,
            "query": query,
            "selected_category": category,
            "selected_location": location,
            "category_options": category_options,
            "location_options": location_options,
            "result_count": len(business_cards),
            "meta_title": "Service Business Marketplace | GetContractorz",
            "meta_description": (
                "Browse registered service businesses on GetContractorz, review "
                "their public information, and contact the business you choose "
                "directly."
            ),
        },
    )


def marketplace_business_detail(request, business_slug):
    business = get_object_or_404(
        Business.objects.filter(is_active=True).prefetch_related("services_offered"),
        slug=business_slug,
    )
    card = _business_public_data(business)
    return render(
        request,
        "public_site/marketplace_business_detail.html",
        {
            "card": card,
            "meta_title": f"{card['name']} | GetContractorz Marketplace",
            "meta_description": (
                f"View public information for {card['name']}, including service "
                "categories, location details, and contact information supplied "
                "through GetContractorz."
            ),
        },
    )


def faqs(request):
    return render(
        request,
        "public_site/faqs.html",
        {
            "meta_title": "GetContractorz FAQ | Business, Clients & Marketplace",
            "meta_description": (
                "Get answers about GetContractorz business registration, "
                "features, clients, employees, Marketplace listings, current "
                "free access, verification, and more."
            ),
        },
    )


def contact(request):
    return render(
        request,
        "public_site/contact.html",
        {
            "meta_title": "Contact GetContractorz | Product, Account & Marketplace Help",
            "meta_description": (
                "Contact GetContractorz with product, account, "
                "business-registration, client, Marketplace, or general "
                "questions using the approved contact form."
            ),
        },
    )


def customer_support(request):
    return redirect("public_site:faq", permanent=True)


def robots(request):
    sitemap_url = request.build_absolute_uri(reverse("public_site:sitemap"))
    return HttpResponse(
        f"User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n"
        f"Disallow: /user/\nSitemap: {sitemap_url}\n",
        content_type="text/plain",
    )


def sitemap(request):
    route_names = [
        "home",
        "for-service-businesses",
        "features",
        "how-it-works",
        "for-clients",
        "service-categories",
        "marketplace",
        "industries",
        "about",
        "team",
        "contact",
        "faq",
        "terms-and-conditions",
        "privacy-policy",
    ]
    urls = []
    for name in route_names:
        location = request.build_absolute_uri(reverse(f"public_site:{name}"))
        urls.append(f"<url><loc>{location}</loc></url>")
    for business in Business.objects.filter(is_active=True).order_by("slug"):
        location = request.build_absolute_uri(
            reverse(
                "public_site:marketplace-business-detail",
                kwargs={"business_slug": business.slug},
            )
        )
        urls.append(f"<url><loc>{location}</loc></url>")
    return HttpResponse(
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f"{''.join(urls)}</urlset>",
        content_type="application/xml",
    )


class PublicPageView(TemplateView):
    template_name = "public_site/content_page.html"

    def get_template_names(self):
        dedicated_templates = {
            "for-service-businesses": "public_site/for_service_businesses.html",
            "features": "public_site/features.html",
            "how-it-works": "public_site/how_it_works.html",
            "for-clients": "public_site/for_clients.html",
            "service-categories": "public_site/service_categories.html",
            "about": "public_site/about.html",
            "industries": "public_site/industries.html",
            "privacy-policy": "public_site/privacy_policy.html",
            "services": "public_site/services.html",
        }
        if template_name := dedicated_templates.get(self.kwargs["page"]):
            return [template_name]
        return super().get_template_names()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        page = kwargs["page"]
        title, description = PUBLIC_PAGE_METADATA[page]
        context.update(
            page=page,
            page_title=title,
            meta_title=f"{title} | GetContractorz",
            meta_description=description,
        )
        if page in {"services", "terms-and-conditions"}:
            context["meta_robots"] = "noindex,follow"
        if page == "industries":
            context["faqs"] = FAQ.objects.filter(is_active=True)
        return context
