from rest_framework import pagination
from rest_framework.response import Response


class InvoicePagination(pagination.PageNumberPagination):
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
                {'name': 'invoice_number', 'title': 'Invoice'},
                {'name': 'business_name', 'title': 'Business'},
                {'name': 'client_name', 'title': 'Client'},
                {'name': 'service_name', 'title': 'Service'},
                {'name': 'invoice_total', 'title': 'Total'},
                {'name': 'due_date', 'title': 'Due Date'},
                {'name': 'created_at', 'title': 'Created At'},
            ],
            'results': data,
        })
