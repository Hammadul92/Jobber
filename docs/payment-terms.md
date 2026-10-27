# Payment terms

Businesses choose a default payment term in their profile. Automatically generated quote drafts copy that default. A manager can change a quote's term before sending it; manually created quotes require a choice. The three choices are Due on Receipt, Net 15 days, and Net 30 days. A signed quote keeps its agreed term. The quote's **Valid Until** date is separate: it controls when the quote expires.

Invoices created for a service with a signed quote inherit its term, and the API rejects a conflicting choice. Standalone invoices require a term. Managers may enter a specific due date on a draft invoice. If left blank, the first successful send sets a due date of 0, 15, or 30 calendar days after the business's local send date. A manually entered due date takes precedence. The invoice stores `sent_at` on first send; resending changes neither `sent_at` nor the due date. Due dates on sent invoices with structured terms cannot be edited.

The migration leaves historical quote terms and invoice terms empty. Historical invoices retain their due dates. Existing draft quotes need a term before they can be sent; existing invoices without structured terms continue using their saved due dates.
