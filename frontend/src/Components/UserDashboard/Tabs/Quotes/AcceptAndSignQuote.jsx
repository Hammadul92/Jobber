import { useRef, useState } from 'react';
import SignaturePad from 'react-signature-pad-wrapper';
import SubmitButton from '../../../ui/SubmitButton';

export default function AcceptAndSignQuote({ setShowSignModal, handleSignSubmit, signing }) {
    const [signatureData, setSignatureData] = useState(null);
    const sigPadRef = useRef(null);

    const clearSignature = () => {
        sigPadRef.current.clear();
        setSignatureData(null);
    };

    const saveSignature = () => {
        if (sigPadRef.current.isEmpty()) {
            alert('Please draw your signature before saving.');
            return;
        }
        const dataUrl = sigPadRef.current.toDataURL();
        setSignatureData(dataUrl);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (!signatureData) {
            alert('Please save your signature before submitting.');
            return;
        }
        handleSignSubmit({ signature: signatureData });
    };

    const isSubmitDisabled = !signatureData;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
                <form onSubmit={onSubmit}>
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                        <h5 className="text-lg font-semibold text-gray-900">Accept & Sign Quote</h5>
                        <button
                            type="button"
                            className="text-gray-500 transition hover:text-gray-800"
                            onClick={() => setShowSignModal(false)}
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>

                    <div className="px-6 py-5">
                        <div className="mb-3">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-800">Draw Your Signature</label>
                                <div className="flex items-center gap-3 text-sm font-semibold">
                                    <button
                                        type="button"
                                        className="text-gray-600 transition hover:text-gray-900"
                                        onClick={clearSignature}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        className="text-accent transition hover:text-accentLight"
                                        onClick={saveSignature}
                                    >
                                        Save Signature
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center shadow-sm">
                                <SignaturePad
                                    ref={sigPadRef}
                                    options={{
                                        penColor: 'black',
                                        backgroundColor: '#fff',
                                        minWidth: 1,
                                        maxWidth: 2,
                                    }}
                                />
                            </div>

                            {signatureData && (
                                <div className="mt-3 flex items-center gap-3 text-sm text-gray-800">
                                    <span className="font-semibold">Saved Signature Preview:</span>
                                    <img
                                        src={signatureData}
                                        alt="Signature Preview"
                                        className="h-16 rounded border border-gray-200 bg-white p-2"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                        <button
                            type="button"
                            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                            onClick={() => setShowSignModal(false)}
                        >
                            Cancel
                        </button>
                        <SubmitButton
                            isLoading={signing}
                            btnClass="bg-accent px-4 py-2 text-sm text-white shadow-sm hover:bg-accentLight"
                            btnName="Submit"
                            isDisabled={isSubmitDisabled}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
