from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.generic import TemplateView

from core.models import Business, FAQ


PUBLIC_PAGE_METADATA = {
    "about": (
        "About GetContractorz",
        "Learn why GetContractorz was created and how it helps service businesses "
        "manage clients, quotations, jobs, teams, invoices, and payments.",
    ),
    "industries": (
        "Industries",
        "Service business management software for landscaping, cleaning, plumbing, "
        "electrical, HVAC, and more.",
    ),
    "services": (
        "Features",
        "Explore GetContractorz features for client management, questionnaires, "
        "quotations, jobs, teams, invoices, payments, and customer access.",
    ),
    "team": (
        "Our Team",
        "Meet the team building GetContractorz, a service business management platform based in Calgary, Alberta.",
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
            "meta_title": "Service Business Management Software | GetContractorz",
            "meta_description": (
                "Manage clients, service questionnaires, quotations, jobs, field "
                "teams, invoices and online payments in one service business "
                "management platform. Start free."
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
            "meta_title": "Service Business Marketplace | GetContractorz",
            "meta_description": (
                "Browse service businesses registered on GetContractorz and use "
                "their published contact information to discuss your service "
                "requirements directly."
            ),
        },
    )


def faqs(request):
    return render(
        request,
        "public_site/faqs.html",
        {
            "faqs": FAQ.objects.filter(is_active=True),
            "meta_title": "Service Business Management Software FAQs",
            "meta_description": (
                "Get answers about GetContractorz features, client portals, "
                "quotations, job management, team accounts, invoices, Stripe "
                "payments and free access."
            ),
        },
    )


def contact(request):
    return render(
        request,
        "public_site/contact.html",
        {
            "faqs": FAQ.objects.filter(is_active=True),
            "meta_title": "Contact GetContractorz | Product and Account Support",
            "meta_description": (
                "Contact GetContractorz for product questions, account assistance, "
                "marketplace enquiries or information about service business "
                "management software."
            ),
        },
    )


def customer_support(request):
    return redirect("public_site:faqs", permanent=True)


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
            meta_title=f"{title} | GetContractorz",
            meta_description=description,
        )
        if page in {"services", "terms-and-conditions"}:
            context["meta_robots"] = "noindex,follow"
        if page == "industries":
            context["faqs"] = FAQ.objects.filter(is_active=True)
        return context
