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
        <div
            className="modal fade show"
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
            tabIndex="-1"
            role="dialog"
        >
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                <div className="modal-content">
                    <form onSubmit={onSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">Accept & Sign Quote</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowSignModal(false)}
                            ></button>
                        </div>

                        <div className="modal-body">
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label mb-0">Draw Your Signature</label>
                                    <div>
                                        <button
                                            type="button"
                                            className="btn text-secondary p-0 me-2"
                                            onClick={clearSignature}
                                        >
                                            Clear
                                        </button>
                                        <button type="button" className="btn text-success p-0" onClick={saveSignature}>
                                            Save Signature
                                        </button>
                                    </div>
                                </div>

                                <div className="border rounded bg-light p-2 text-center">
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
                                    <div className="mt-3 d-flex">
                                        <label className="me-2">Saved Signature Preview:</label>
                                        <img
                                            src={signatureData}
                                            alt="Signature Preview"
                                            className="border rounded p-2"
                                            style={{
                                                maxWidth: '100%',
                                                height: '60px',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-sm btn-dark"
                                onClick={() => setShowSignModal(false)}
                            >
                                Cancel
                            </button>
                            <SubmitButton
                                isLoading={signing}
                                btnClass="btn btn-sm btn-success"
                                btnName="Submit"
                                isDisabled={isSubmitDisabled}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
