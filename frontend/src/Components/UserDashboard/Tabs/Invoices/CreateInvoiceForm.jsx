import { useState, useEffect } from 'react';
import { useFetchClientsQuery, useFetchServicesQuery, useCreateInvoiceMutation } from '../../../../store';
import SubmitButton from '../../../../utils/SubmitButton';

export default function CreateInvoiceForm({ token, showModal, setShowModal, setAlert, business }) {
    const [clientId, setClientId] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [currency, setCurrency] = useState('CAD');
    const [subtotal, setSubtotal] = useState('');
    const [taxRate, setTaxRate] = useState('');
    const [taxAmount, setTaxAmount] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [notes, setNotes] = useState('');

    const {
        data: clients = [],
        isLoading: loadingClients,
        isError: errorClients,
    } = useFetchClientsQuery(undefined, { skip: !token });

    const {
        data: services = [],
        isLoading: loadingServices,
        isError: errorServices,
    } = useFetchServicesQuery(clientId, { skip: !clientId || !token });

    const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();

    useEffect(() => {
        if (errorClients) setAlert({ type: 'danger', message: 'Failed to load clients. Please refresh.' });
        if (errorServices) setAlert({ type: 'danger', message: 'Failed to load services for selected client.' });
    }, [errorClients, errorServices]);

    useEffect(() => {
        if (serviceId && services.length) {
            const selectedService = services.find((s) => s.id === Number(serviceId));
            if (selectedService) {
                const taxRatePercent = (selectedService.tax_rate || 0) * 100;
                const price = parseFloat(selectedService.price) || 0;
                const tax = ((price * taxRatePercent) / 100).toFixed(2);
                const total = (price + parseFloat(tax)).toFixed(2);
                setSubtotal(price);
                setTaxRate(taxRatePercent);
                setTaxAmount(tax);
                setTotalAmount(total);
                setCurrency(selectedService.currency || 'CAD');
            }
        }
    }, [serviceId, services]);

    useEffect(() => {
        if (subtotal !== '' && taxRate !== '') {
            const tax = ((parseFloat(subtotal) * parseFloat(taxRate)) / 100).toFixed(2);
            const total = (parseFloat(subtotal) + parseFloat(tax)).toFixed(2);
            setTaxAmount(tax);
            setTotalAmount(total);
        }
    }, [subtotal, taxRate]);

    useEffect(() => {
        if (!serviceId) {
            setSubtotal('');
            setTaxRate('');
            setTaxAmount('');
            setTotalAmount('');
            setCurrency('CAD');
        }
    }, [serviceId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createInvoice({
                business: business?.id,
                client: clientId,
                service: serviceId,
                due_date: dueDate,
                currency,
                subtotal,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                notes,
            }).unwrap();

            setAlert({ type: 'success', message: 'Invoice created successfully!' });

            setClientId('');
            setServiceId('');
            setDueDate('');
            setSubtotal('');
            setTaxRate('');
            setTaxAmount('');
            setTotalAmount('');
            setCurrency('CAD');
            setNotes('');
            setShowModal(false);
        } catch (err) {
            const msg = err?.data?.error || err?.data?.detail || 'Failed to create invoice. Please try again.';
            setAlert({ type: 'danger', message: msg });
        }
    };

    return (
        <>
            {showModal && (
                <div className="modal d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Create New Invoice</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="field-wrapper">
                                                <select
                                                    className="form-select"
                                                    value={clientId}
                                                    onChange={(e) => {
                                                        setClientId(e.target.value);
                                                        setServiceId('');
                                                    }}
                                                    required
                                                >
                                                    <option value="">Select Client</option>
                                                    {!loadingClients &&
                                                        clients?.results.map((c) => (
                                                            <option key={c.id} value={c.id}>
                                                                {c.client_name}
                                                            </option>
                                                        ))}
                                                </select>
                                                <label className="form-label">Client (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-8">
                                            <div className="field-wrapper">
                                                <select
                                                    className="form-select"
                                                    value={serviceId}
                                                    onChange={(e) => setServiceId(e.target.value)}
                                                    disabled={!clientId}
                                                    required
                                                >
                                                    <option value="">
                                                        {clientId ? 'Select Service' : 'Select Client first'}
                                                    </option>
                                                    {!loadingServices &&
                                                        services.map(
                                                            (s) =>
                                                                s.status === 'ACTIVE' &&
                                                                s?.quotations.find((q) => q.status === 'SIGNED') && (
                                                                    <option key={s.id} value={s.id}>
                                                                        {s.service_name} ({s.client_name} -{' '}
                                                                        {s.street_address})
                                                                    </option>
                                                                )
                                                        )}
                                                </select>
                                                <label className="form-label">Service (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="field-wrapper">
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={dueDate}
                                                    onChange={(e) => setDueDate(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label">Due Date (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="field-wrapper">
                                                <select
                                                    className="form-select"
                                                    value={currency}
                                                    onChange={(e) => setCurrency(e.target.value)}
                                                >
                                                    <option value="CAD">CAD</option>
                                                    <option value="USD">USD</option>
                                                </select>
                                                <label className="form-label">Currency</label>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="field-wrapper">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={subtotal}
                                                    onChange={(e) => setSubtotal(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label">Subtotal (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="field-wrapper">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={taxRate}
                                                    onChange={(e) => setTaxRate(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label">Tax Rate (%) (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="field-wrapper">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={taxAmount}
                                                    readOnly
                                                    required
                                                />
                                                <label className="form-label">Tax Amount (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="field-wrapper">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={totalAmount}
                                                    readOnly
                                                    required
                                                />
                                                <label className="form-label">Total Amount (*)</label>
                                            </div>
                                        </div>

                                        <div className="col-md-12">
                                            <div className="field-wrapper">
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    placeholder="Optional notes or invoice description"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                ></textarea>
                                                <label className="form-label">Notes</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-dark"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <SubmitButton
                                        isLoading={isCreating}
                                        btnClass="btn btn-sm btn-success"
                                        btnName="Create Invoice"
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </>
    );
}
