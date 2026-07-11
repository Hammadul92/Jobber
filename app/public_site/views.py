from django.http import HttpResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.generic import TemplateView

from core.models import Business, FAQ


PUBLIC_PAGE_METADATA = {
    "about": (
        "About Contractorz",
        "See how Contractorz connects client intake, quotes, jobs, invoices, and payouts for service businesses.",
    ),
    "industries": (
        "Industries",
        "Contractor operations software for landscaping, cleaning, plumbing, "
        "electrical, HVAC, and more.",
    ),
    "services": (
        "Services",
        "Explore the home-service industries supported by Contractorz.",
    ),
    "team": ("Our Team", "Meet the builders, thinkers, and doers behind Contractorz."),
    "terms-and-conditions": (
        "Terms and Conditions",
        "Terms governing use of the Contractorz platform.",
    ),
    "privacy-policy": (
        "Privacy Policy",
        "How Contractorz collects, uses, shares, retains, and protects personal information across its service-business platform.",
    ),
}


def home(request):
    businesses = list(
        Business.objects.filter(is_active=True)
        .exclude(logo="")
        .select_related("owner")
        .order_by("-created_at")[:10]
    )
    return render(
        request,
        "public_site/home.html",
        {
            "businesses": businesses,
            "faqs": FAQ.objects.filter(is_active=True),
            "meta_title": "Contractorz | Service Business Operations Platform",
            "meta_description": (
                "Manage clients, questionnaires, quotes, jobs, invoices, and "
                "payouts in one service-business platform."
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
    if query:
        businesses = businesses.filter(name__icontains=query)
    return render(
        request,
        "public_site/marketplace.html",
        {
            "businesses": businesses,
            "query": query,
            "meta_title": "Contractorz Marketplace",
            "meta_description": "Discover trusted Canadian home-service businesses.",
        },
    )


def faqs(request):
    return render(
        request,
        "public_site/faqs.html",
        {
            "faqs": FAQ.objects.filter(is_active=True),
            "meta_title": "Frequently Asked Questions | Contractorz",
            "meta_description": "Answers about Contractorz workflows and accounts.",
        },
    )


def contact(request):
    return render(
        request,
        "public_site/contact.html",
        {
            "faqs": FAQ.objects.filter(is_active=True),
            "meta_title": "Contact Contractorz",
            "meta_description": (
                "Talk with the Contractorz team about your service business."
            ),
        },
    )


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
        "marketplace",
        "industries",
        "services",
        "about",
        "team",
        "contact",
        "faqs",
        "terms-and-conditions",
        "privacy-policy",
    ]
    urls = []
    for name in route_names:
        location = request.build_absolute_uri(reverse(f"public_site:{name}"))
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
            meta_title=f"{title} | Contractorz",
            meta_description=description,
        )
        if page == "industries":
            context["faqs"] = FAQ.objects.filter(is_active=True)
        return context
