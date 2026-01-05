import Input from '../../../../utils/Input';
import Select from '../../../../utils/Select';
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
                                            <Select
                                                id="invoice-client"
                                                label="Client"
                                                value={clientId}
                                                onChange={(val) => {
                                                    setClientId(val);
                                                    setServiceId('');
                                                }}
                                                isRequired={true}
                                                options={[
                                                    { value: '', label: 'Select Client' },
                                                    ...(!loadingClients && clients?.results
                                                        ? clients.results.map((c) => ({
                                                              value: c.id,
                                                              label: c.client_name,
                                                          }))
                                                        : []),
                                                ]}
                                            />
                                        </div>

                                        <div className="col-md-8">
                                            <Select
                                                id="invoice-service"
                                                label="Service"
                                                value={serviceId}
                                                onChange={setServiceId}
                                                isRequired={true}
                                                isDisabled={!clientId}
                                                options={[
                                                    {
                                                        value: '',
                                                        label: clientId ? 'Select Service' : 'Select Client first',
                                                    },
                                                    ...(!loadingServices && services
                                                        ? services
                                                              .filter(
                                                                  (s) =>
                                                                      s.status === 'ACTIVE' &&
                                                                      s?.quotations.find((q) => q.status === 'SIGNED')
                                                              )
                                                              .map((s) => ({
                                                                  value: s.id,
                                                                  label: `${s.service_name} (${s.client_name} - ${s.street_address})`,
                                                              }))
                                                        : []),
                                                ]}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <Input
                                                type="date"
                                                fieldClass="form-control"
                                                value={dueDate}
                                                onChange={setDueDate}
                                                isRequired={true}
                                                label="Due Date"
                                                id="invoice-due-date"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <Select
                                                id="invoice-currency"
                                                label="Currency"
                                                value={currency}
                                                onChange={setCurrency}
                                                isRequired={true}
                                                options={[
                                                    { value: 'CAD', label: 'CAD' },
                                                    { value: 'USD', label: 'USD' },
                                                ]}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <Input
                                                type="number"
                                                fieldClass="form-control"
                                                value={subtotal}
                                                onChange={setSubtotal}
                                                isRequired={true}
                                                label="Subtotal"
                                                id="invoice-subtotal"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <Input
                                                type="number"
                                                fieldClass="form-control"
                                                value={taxRate}
                                                onChange={setTaxRate}
                                                isRequired={true}
                                                label="Tax Rate (%)"
                                                id="invoice-tax-rate"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <Input
                                                type="number"
                                                fieldClass="form-control"
                                                value={taxAmount}
                                                onChange={() => {}}
                                                isDisabled={true}
                                                isRequired={true}
                                                label="Tax Amount"
                                                id="invoice-tax-amount"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <Input
                                                type="number"
                                                fieldClass="form-control"
                                                value={totalAmount}
                                                onChange={() => {}}
                                                isDisabled={true}
                                                isRequired={true}
                                                label="Total Amount"
                                                id="invoice-total-amount"
                                            />
                                        </div>

                                        <div className="col-md-12">
                                            <label className="form-label fw-semibold">Notes</label>
                                            <textarea
                                                className="form-control"
                                                rows="3"
                                                placeholder="Optional notes or invoice description"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            ></textarea>
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
