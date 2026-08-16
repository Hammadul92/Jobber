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
            question="How does GetContractorz work?",
            answer="It connects the service workflow.",
        )

    def test_home_is_server_rendered_with_seo_and_hero_copy(self):
        response = self.client.get(reverse("public_site:home"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "public_site/home.html")
        self.assertContains(response, "<h1", html=False)
        self.assertContains(response, 'rel="canonical"')
        self.assertContains(response, "Service Business Management Software | GetContractorz")
        self.assertContains(response, "Keep your service business organized in one")
        self.assertContains(response, "workspace.")
        self.assertContains(response, "Manage the operational work around your clients and jobs")
        self.assertContains(response, "Get Started Free")
        self.assertContains(response, "Explore the Marketplace")
        self.assertContains(response, "Registration and platform access are currently free.")
        self.assertContains(response, "Less scatter.")
        self.assertContains(response, "More clarity")
        self.assertContains(response, "real service-business workflows.")
        self.assertContains(response, "From business setup to job documentation")
        self.assertContains(response, "process connected.")
        self.assertContains(response, "right role.")
        self.assertContains(response, "service category")
        self.assertContains(response, "Manage your business. Be discoverable in the")
        self.assertContains(response, "Marketplace.")
        self.assertContains(response, "Clear about what GetContractorz does")
        self.assertContains(response, "what it doesn't.")
        self.assertContains(response, "Frequently Asked")
        self.assertContains(response, "Questions")
        self.assertContains(response, "Ready to organize your service business in")
        self.assertContains(response, "one workspace?")
        self.assertContains(response, '"@type": "Organization"')
        self.assertContains(response, '"@type": "WebSite"')
        self.assertContains(response, '"@type": "FAQPage"')
        self.assertNotContains(response, "Example Plumbing")
        self.assertNotContains(response, "How does GetContractorz work?")
        self.assertNotContains(response, "text-white/80")

    def test_for_service_businesses_page_uses_high_intent_product_copy(self):
        response = self.client.get(reverse("public_site:for-service-businesses"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "public_site/for_service_businesses.html")
        self.assertContains(response, "Service Business Management Software for Contractors")
        self.assertContains(response, "service business management software")
        self.assertContains(response, "Manage the work around your jobs")
        self.assertContains(response, "without the")
        self.assertContains(response, "scatter.")
        self.assertContains(response, "Your operations should not depend on a")
        self.assertContains(response, "patchwork of tools.")
        self.assertContains(response, "One business workspace.")
        self.assertContains(response, "Clear responsibilities.")
        self.assertContains(response, "Collect requirements before the")
        self.assertContains(response, "job moves forward.")
        self.assertContains(response, "Assign the work.")
        self.assertContains(response, "Document the result.")
        self.assertContains(response, "Customer-facing records should not live in")
        self.assertContains(response, "isolation.")
        self.assertContains(response, "Start without a current platform")
        self.assertContains(response, "subscription.")
        self.assertContains(response, "Put your clients, services, team, jobs, and business records into")
        self.assertContains(response, "one organized workspace.")
        self.assertContains(response, '"@type": "BreadcrumbList"')
        self.assertContains(response, '"@type": "SoftwareApplication"')
        self.assertContains(response, '"@type": "FAQPage"')
        self.assertContains(response, "for-service-businesses-workspace.png")

    @override_settings(FRONTEND_URL="http://frontend.test:5173/")
    def test_auth_actions_link_to_the_configured_react_frontend(self):
        response = self.client.get(reverse("public_site:home"))

        self.assertContains(response, 'href="http://frontend.test:5173/sign-in"', count=2)
        self.assertContains(response, 'href="http://frontend.test:5173/register"')
        self.assertNotContains(response, "data-account-toggle")
        self.assertNotContains(response, "session-bridge")

    def test_public_header_marks_current_page_as_active(self):
        routes = [
            ("home", "Home"),
            ("industries", "Industries"),
            ("features", "Features"),
            ("marketplace", "Marketplace"),
            ("faqs", "FAQs"),
            ("about", "About Us"),
            ("contact", "Contact Us"),
        ]

        for route_name, label in routes:
            with self.subTest(route_name=route_name):
                response = self.client.get(reverse(f"public_site:{route_name}"))

                self.assertContains(response, 'aria-current="page"')
                self.assertContains(response, label)

    def test_marketplace_lists_business_and_service(self):
        response = self.client.get(reverse("public_site:marketplace"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Service Business Marketplace Directory")
        self.assertContains(response, "Browse active service businesses")
        self.assertContains(response, "Example Plumbing")
        self.assertContains(response, "Plumbing")
        self.assertContains(response, "Marketplace listings are published by registered businesses")
        self.assertContains(response, "Service agreements, availability, pricing, work quality")
        self.assertContains(response, "Run a service business? Build your workspace with GetContractorz")
        self.assertContains(response, '"@type":"ItemList"')

    def test_contact_matches_public_content_and_includes_faqs(self):
        response = self.client.get(reverse("public_site:contact"))

        self.assertContains(response, "Product Questions")
        self.assertContains(response, "Account Assistance")
        self.assertContains(response, "How does GetContractorz work?")
        self.assertContains(response, 'name="privacy_agreed"')

    def test_industries_renders_the_service_industries_page(self):
        response = self.client.get(reverse("public_site:industries"))

        self.assertTemplateUsed(response, "public_site/industries.html")
        self.assertContains(response, "Service business management software for")
        self.assertContains(response, "50+ HOME SERVICE INDUSTRIES")
        self.assertContains(response, "Plumbing")
        self.assertContains(response, "Electrical")
        self.assertContains(response, "HVAC")
        self.assertContains(response, "Cleaning")
        self.assertContains(response, "Landscaping")
        self.assertContains(response, "Features that fit service businesses across industries")
        self.assertContains(response, "How GetContractorz supports the work from request to payment.")
        self.assertContains(response, "Capture service requirements")
        self.assertContains(response, "Invoices and payments")
        self.assertContains(response, "Start managing service work with GetContractorz")
        self.assertContains(response, "How does GetContractorz work?")
        self.assertNotContains(response, "email/SMS")
        self.assertNotContains(response, "mobile app")
        self.assertNotContains(response, "routes planned")

    def test_features_page_uses_product_software_positioning(self):
        response = self.client.get(reverse("public_site:features"))

        self.assertTemplateUsed(response, "public_site/features.html")
        self.assertContains(response, "Service Business Software Features")
        self.assertContains(response, "service business software features")
        self.assertContains(response, "The workflows behind your service business")
        self.assertContains(response, "one place.")
        self.assertContains(response, "Clients &amp; Services")
        self.assertContains(response, "Collect the information each service requires.")
        self.assertContains(response, "Give employees a clear job to complete.")
        self.assertContains(response, "Keep visual job documentation with the work.")
        self.assertContains(response, "Create and send quotes from the business workspace.")
        self.assertContains(response, "Manage invoices alongside the service workflow.")
        self.assertContains(response, "Ready to start using the")
        self.assertContains(response, "workspace?")
        self.assertContains(response, '"@type": "BreadcrumbList"')
        self.assertContains(response, '"@type": "SoftwareApplication"')
        self.assertContains(response, '"@type": "FAQPage"')
        self.assertContains(response, "features-workspace-overview.png")
        self.assertNotContains(response, 'content="noindex,follow"')
        self.assertNotContains(response, "scheduling and dispatch are included")

    def test_how_it_works_page_uses_role_workflow_copy(self):
        response = self.client.get(reverse("public_site:how-it-works"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "public_site/how_it_works.html")
        self.assertContains(response, "How GetContractorz Works for Service Businesses")
        self.assertContains(response, "how GetContractorz works")
        self.assertContains(response, "See how each role moves through")
        self.assertContains(response, "GetContractorz.")
        self.assertContains(response, "Manager")
        self.assertContains(response, "Client")
        self.assertContains(response, "Employee")
        self.assertContains(response, "Marketplace visitor")
        self.assertContains(response, "From new account to")
        self.assertContains(response, "business workspace.")
        self.assertContains(response, "From invitation to")
        self.assertContains(response, "active service.")
        self.assertContains(response, "A focused workflow for the person")
        self.assertContains(response, "completing the job.")
        self.assertContains(response, "Keep business administration connected to the")
        self.assertContains(response, "operational record.")
        self.assertContains(response, "Discover a business.")
        self.assertContains(response, "Contact it directly.")
        self.assertContains(response, "Ready to set up your")
        self.assertContains(response, "business workflow?")
        self.assertContains(response, '"@type": "BreadcrumbList"')
        self.assertContains(response, '"@type": "HowTo"')
        self.assertContains(response, '"@type": "FAQPage"')
        self.assertContains(response, "how-it-works-workflow.png")
        self.assertNotContains(response, "dots-bg.svg")

    def test_faq_page_matches_the_react_hero_and_accordion_structure(self):
        response = self.client.get(reverse("public_site:faqs"))

        self.assertContains(response, "WE'VE GOT YOU COVERED")
        self.assertContains(response, "rounded-horizontal-rectangle-white.svg")
        self.assertContains(response, 'transition-[max-height,opacity]')
        self.assertContains(response, 'style="max-height:500px;opacity:1"')

    def test_about_renders_all_react_content_sections(self):
        response = self.client.get(reverse("public_site:about"))

        self.assertTemplateUsed(response, "public_site/about.html")
        self.assertContains(response, "About GetContractorz Service Business Management Software")
        self.assertContains(response, "ABOUT GETCONTRACTORZ")
        self.assertContains(response, "The full service lifecycle in one place.")
        self.assertContains(response, "Stripe")
        self.assertContains(response, "Built around real service work.")
        self.assertNotContains(response, "works offline")
        self.assertNotContains(response, "accounting software")
        self.assertNotContains(response, "Ready To Design Smarter?")

    def test_team_page_uses_credibility_focused_product_copy(self):
        response = self.client.get(reverse("public_site:team"))

        self.assertContains(response, "GetContractorz Team")
        self.assertContains(response, "Based in Calgary")
        self.assertContains(response, "The team behind GetContractorz is building for real service workflows")
        self.assertContains(response, "Built around the dependencies service businesses manage every day.")
        self.assertContains(response, "Client intake")
        self.assertContains(response, "Quotation approval")
        self.assertContains(response, "Billing records")
        self.assertNotContains(response, "Content Being Prepared")

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
            "features",
            "how-it-works",
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

        self.assertRedirects(
            response,
            reverse("public_site:faqs"),
            status_code=301,
            target_status_code=200,
        )
        home = self.client.get(reverse("public_site:home"))
        self.assertNotContains(home, 'href="/customer-support/"')

    def test_privacy_policy_describes_application_data_and_providers(self):
        response = self.client.get(reverse("public_site:privacy-policy"))

        self.assertTemplateUsed(response, "public_site/privacy_policy.html")
        self.assertContains(response, "Effective July 11, 2026")
        self.assertContains(response, "YOUR WORKFLOW. YOUR INFORMATION.")
        self.assertContains(response, "Privacy at GetContractorz")
        self.assertContains(response, "questionnaire responses")
        self.assertContains(response, "electronic signature images")
        self.assertContains(response, "before-and-after job photos")
        self.assertContains(response, "Stripe")
        self.assertContains(response, "SendGrid")
        self.assertContains(response, "soft deletion")
        self.assertContains(response, "We do not sell personal information")
