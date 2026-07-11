from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse

from core.models import Business, FAQ


class PublicSiteViewTests(TestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user(
            email="owner@example.com",
            password="password",
            name="Owner",
            phone="+1 403-555-0100",
            role="MANAGER",
        )
        self.business = Business.objects.create(
            owner=self.owner,
            name="Example Plumbing",
            slug="example-plumbing",
            phone="+1 403-555-0101",
            email="hello@example.com",
            business_description="Residential plumbing services.",
            street_address="1 Main Street",
            city="Calgary",
            province_state="AB",
            postal_code="T2P 1J9",
            business_number="EXAMPLE-1",
            logo="business_logo/example.png",
        )
        self.business.services_offered.add("Plumbing")
        FAQ.objects.create(
            question="How does Contractorz work?",
            answer="It connects the service workflow.",
        )

    def test_home_is_server_rendered_with_seo_and_dynamic_content(self):
        response = self.client.get(reverse("public_site:home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<h1", html=False)
        self.assertContains(response, "Example Plumbing")
        self.assertContains(response, "How does Contractorz work?")
        self.assertContains(response, 'rel="canonical"')
        self.assertContains(response, 'href="/#faqs"', count=2)
        self.assertContains(response, 'id="faqs"')
        self.assertContains(response, 'class="text-base leading-relaxed text-white/80 md:text-lg"')
        self.assertNotContains(response, "Ready To Design Smarter?")

    @override_settings(FRONTEND_URL="http://frontend.test:5173/")
    def test_auth_actions_link_to_the_configured_react_frontend(self):
        response = self.client.get(reverse("public_site:home"))
        industries_response = self.client.get(reverse("public_site:industries"))

        self.assertContains(response, 'href="http://frontend.test:5173/sign-in"', count=2)
        self.assertContains(
            industries_response,
            'href="http://frontend.test:5173/register"',
        )
        self.assertContains(response, 'data-frontend-url="http://frontend.test:5173"')

    def test_marketplace_lists_business_and_service(self):
        response = self.client.get(reverse("public_site:marketplace"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Example Plumbing")
        self.assertContains(response, "Plumbing")
        self.assertContains(response, '"@type":"ItemList"')

    def test_contact_matches_public_content_and_includes_faqs(self):
        response = self.client.get(reverse("public_site:contact"))

        self.assertContains(response, "Talk to Sales")
        self.assertContains(response, "Book a Live Demo")
        self.assertContains(response, "How does Contractorz work?")
        self.assertContains(response, 'name="privacy_agreed"')

    def test_industries_renders_the_full_landscaping_page(self):
        response = self.client.get(reverse("public_site:industries"))

        self.assertTemplateUsed(response, "public_site/industries.html")
        self.assertContains(response, "LANDSCAPING WORK IS HARD ENOUGH")
        self.assertContains(response, "Features built for landscaping businesses")
        self.assertContains(response, "How a job flows in Contractorz")
        self.assertContains(response, "Client completes the service questionnaire")
        self.assertContains(response, "Invoicing & Stripe Payments")
        self.assertContains(response, "North Trail Landscaping")
        self.assertContains(response, "How does Contractorz work?")
        self.assertNotContains(response, "email/SMS")
        self.assertNotContains(response, "mobile app")
        self.assertNotContains(response, "routes planned")

    def test_services_matches_the_react_coming_soon_page(self):
        response = self.client.get(reverse("public_site:services"))

        self.assertTemplateUsed(response, "public_site/services.html")
        self.assertContains(response, "Services")
        self.assertContains(response, "Coming Soon")

    def test_faq_page_matches_the_react_hero_and_accordion_structure(self):
        response = self.client.get(reverse("public_site:faqs"))

        self.assertContains(response, "WE'VE GOT YOU COVERED")
        self.assertContains(response, "rounded-horizontal-rectangle-white.svg")
        self.assertContains(response, 'transition-[max-height,opacity]')
        self.assertContains(response, 'style="max-height:500px;opacity:1"')

    def test_about_renders_all_react_content_sections(self):
        response = self.client.get(reverse("public_site:about"))

        self.assertTemplateUsed(response, "public_site/about.html")
        self.assertContains(response, "WE ARE CONTRACTORZ")
        self.assertContains(response, "The full service lifecycle in one place.")
        self.assertContains(response, "Stripe")
        self.assertContains(response, "Built around real service work.")
        self.assertNotContains(response, "works offline")
        self.assertNotContains(response, "accounting software")
        self.assertNotContains(response, "Ready To Design Smarter?")

    def test_marketplace_search_filters_businesses(self):
        response = self.client.get(
            reverse("public_site:marketplace"),
            {"q": "missing"},
        )

        self.assertContains(response, "No businesses found")
        self.assertNotContains(response, "Residential plumbing services.")

    def test_all_public_routes_render(self):
        route_names = [
            "about",
            "industries",
            "services",
            "team",
            "terms-and-conditions",
            "privacy-policy",
            "contact",
            "faqs",
        ]

        for route_name in route_names:
            with self.subTest(route_name=route_name):
                response = self.client.get(reverse(f"public_site:{route_name}"))
                self.assertEqual(response.status_code, 200)

    def test_react_and_system_routes_are_not_registered_as_public_pages(self):
        public_paths = {pattern.pattern._route for pattern in __import__(
            "public_site.urls", fromlist=["urlpatterns"]
        ).urlpatterns}

        self.assertNotIn("user/", public_paths)
        self.assertNotIn("sign-in/", public_paths)
        self.assertNotIn("admin/", public_paths)
        self.assertNotIn("api/", public_paths)

    def test_robots_and_sitemap_expose_public_routes(self):
        robots = self.client.get(reverse("public_site:robots"))
        sitemap = self.client.get(reverse("public_site:sitemap"))

        self.assertContains(robots, "Disallow: /user/")
        self.assertContains(robots, "/sitemap.xml")
        self.assertEqual(sitemap["Content-Type"], "application/xml")
        self.assertContains(sitemap, reverse("public_site:marketplace"))

    def test_customer_support_is_not_a_separate_public_page(self):
        response = self.client.get("/customer-support/")

        self.assertEqual(response.status_code, 404)
        home = self.client.get(reverse("public_site:home"))
        self.assertNotContains(home, 'href="/customer-support/"')

    def test_privacy_policy_describes_application_data_and_providers(self):
        response = self.client.get(reverse("public_site:privacy-policy"))

        self.assertTemplateUsed(response, "public_site/privacy_policy.html")
        self.assertContains(response, "Effective July 11, 2026")
        self.assertContains(response, "YOUR WORKFLOW. YOUR INFORMATION.")
        self.assertContains(response, "Privacy at Contractorz")
        self.assertContains(response, "questionnaire responses")
        self.assertContains(response, "electronic signature images")
        self.assertContains(response, "before-and-after job photos")
        self.assertContains(response, "Stripe")
        self.assertContains(response, "SendGrid")
        self.assertContains(response, "soft deletion")
        self.assertContains(response, "We do not sell personal information")
