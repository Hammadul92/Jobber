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
                {'name': 'client_phone', 'title': 'Phone'},
                {'name': 'payment_method', 'title': 'Payment Method'},
            ],
            'results': data,
        })
