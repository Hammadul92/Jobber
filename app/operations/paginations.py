from rest_framework import pagination
from rest_framework.response import Response


class ClientPagination(pagination.PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'columns': [
                {'name': 'client_name', 'title': 'Name'},
                {'name': 'client_email', 'title': 'Email'},
                {'name': 'client_phone', 'title': 'Phone'}
            ],
            'results': data,
        })


class TeamMemberPagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'columns': [
                {'name': 'employee_name', 'title': 'Name'},
                {'name': 'employee_email', 'title': 'Email'},
                {'name': 'employee_phone', 'title': 'Phone'},
                {'name': 'role', 'title': 'Role'}
            ],
            'results': data,
        })


class QuotePagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        if self.request.user.role == "MANAGER":
            columns = [
                {'name': 'quote_number', 'title': 'Quote'},
                {'name': 'service_name', 'title': 'Service'},
                {'name': 'client_name', 'title': 'Client'},
                {'name': 'valid_until', 'title': 'Valid Until'}
            ]
        else:
            columns = [
                {'name': 'quote_number', 'title': 'Quote'},
                {'name': 'service_name', 'title': 'Service'},
                {'name': 'business_name', 'title': 'Business'},
            ]

        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'columns': columns,
            'results': data,
        })
