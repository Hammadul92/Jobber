from django.urls import path
from django.views.generic import RedirectView

from public_site import views


app_name = "public_site"

urlpatterns = [
    path("", views.home, name="home"),
    path("marketplace/", views.marketplace, name="marketplace"),
    path(
        "marketplace/business/<slug:business_slug>/",
        views.marketplace_business_detail,
        name="marketplace-business-detail",
    ),
    path("faq/", views.faqs, name="faq"),
    path("faqs/", views.faqs, name="faqs"),
    path("contact/", views.contact, name="contact"),
    path("customer-support/", views.customer_support, name="customer-support"),
    path(
        "industries/",
        RedirectView.as_view(
            pattern_name="public_site:service-categories", permanent=True
        ),
        name="industries",
    ),
    path(
        "services/",
        RedirectView.as_view(pattern_name="public_site:features", permanent=True),
        name="services",
    ),
    path(
        "team/",
        RedirectView.as_view(pattern_name="public_site:about", permanent=True),
        name="team",
    ),
    path("robots.txt", views.robots, name="robots"),
    path("sitemap.xml", views.sitemap, name="sitemap"),
]

for page in views.PUBLIC_PAGE_METADATA:
    urlpatterns.append(
        path(
            f"{page}/",
            views.PublicPageView.as_view(),
            {"page": page},
            name=page,
        )
    )
