import Input from '../../../ui/Input';
import Select from '../../../ui/Select';
import { useState, useEffect } from 'react';
import { useFetchClientsQuery, useFetchServicesQuery, useCreateInvoiceMutation } from '../../../../store';
import SubmitButton from '../../../ui/SubmitButton';
import { CgClose } from 'react-icons/cg'

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
    }, [errorClients, errorServices]); // eslint-disable-line react-hooks/exhaustive-deps

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
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
                    <div 
                    className='relative z-10 max-w-4xl rounded-2xl bg-white shadow-xl'
                    onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 rounded-t-2xl bg-secondary text-white border-b border-gray-100">
                            <h5 className="text-lg font-semibold font-heading">Create New Invoice</h5>
                            <button
                                type="button"
                                className="text-gray-200 transition hover:text-gray-400"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                <CgClose className="h-5 w-5" />
                            </button>
                        </div>
                        <form
                            onSubmit={handleSubmit}
                            className="p-6"
                            role="dialog"
                            aria-modal="true"
                        >

                            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                                            ? clients.results.map((c) => ({ value: c.id, label: c.client_name }))
                                            : []),
                                    ]}
                                />

                                <div className="lg:col-span-2">
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

                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={setDueDate}
                                    isRequired={true}
                                    label="Due Date"
                                    id="invoice-due-date"
                                />

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

                                <Input
                                    type="number"
                                    value={subtotal}
                                    onChange={setSubtotal}
                                    isRequired={true}
                                    label="Subtotal"
                                    id="invoice-subtotal"
                                />

                                <Input
                                    type="number"
                                    value={taxRate}
                                    onChange={setTaxRate}
                                    isRequired={true}
                                    label="Tax Rate (%)"
                                    id="invoice-tax-rate"
                                />

                                <Input
                                    type="number"
                                    value={taxAmount}
                                    onChange={() => { }}
                                    isDisabled={true}
                                    isRequired={true}
                                    label="Tax Amount"
                                    id="invoice-tax-amount"
                                />

                                <Input
                                    type="number"
                                    value={totalAmount}
                                    onChange={() => { }}
                                    isDisabled={true}
                                    isRequired={true}
                                    label="Total Amount"
                                    id="invoice-total-amount"
                                />
                            </div>

                            <div className="mt-3">
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Notes</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                    rows="3"
                                    placeholder="Optional notes or invoice description"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <SubmitButton
                                    isLoading={isCreating}
                                    btnClass="bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accentLight"
                                    btnName="Create Invoice"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
