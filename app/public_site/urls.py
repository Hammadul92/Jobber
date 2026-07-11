from django.urls import path

from public_site import views


app_name = "public_site"

urlpatterns = [
    path("", views.home, name="home"),
    path("marketplace/", views.marketplace, name="marketplace"),
    path("faqs/", views.faqs, name="faqs"),
    path("contact/", views.contact, name="contact"),
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
