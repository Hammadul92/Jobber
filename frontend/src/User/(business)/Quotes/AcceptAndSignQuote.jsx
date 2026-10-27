import { useEffect, useRef, useState } from "react";
import SignaturePad from "react-signature-pad-wrapper";
import SubmitButton from "../../../Components/ui/SubmitButton";
import { LuPenTool, LuSignature, LuShieldCheck, LuX } from "react-icons/lu";
import ConfirmCustomerNotification from "../../../Components/ui/ConfirmCustomerNotification";

export default function AcceptAndSignQuote({
  setShowSignModal,
  handleSignSubmit,
  signing,
}) {
  const [signatureData, setSignatureData] = useState(null);
  const [confirmSigning, setConfirmSigning] = useState(false);
  const sigPadRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const clearSignature = () => {
    sigPadRef.current.clear();
    setSignatureData(null);
  };

  const saveSignature = () => {
    if (sigPadRef.current.isEmpty()) {
      alert("Please draw your signature before saving.");
      return;
    }
    const dataUrl = sigPadRef.current.toDataURL();
    setSignatureData(dataUrl);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!signatureData) {
      alert("Please save your signature before submitting.");
      return;
    }
    setConfirmSigning(true);
  };

  const isSubmitDisabled = !signatureData;

  return (
    <>
    <ConfirmCustomerNotification
      open={confirmSigning}
      detail="Signing this quote will email you a copy of the signed quote."
      onYes={async () => {
        if (signing) return;
        await handleSignSubmit({ signature: signatureData });
        setConfirmSigning(false);
      }}
      onNo={() => setConfirmSigning(false)}
      isLoading={signing}
    />
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/50 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-signature-title"
    >
      <div
        className="max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto overscroll-contain rounded-3xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[calc(100dvh-3rem)]"
        style={{ maxWidth: "560px" }}
      >
        <form onSubmit={onSubmit}>
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h5 id="quote-signature-title" className="text-[22px] font-semibold tracking-tight text-slate-900">
                  Accept & Sign Quote
                </h5>
                <p className="mt-1 text-xs text-slate-500">
                  Draw your signature below to confirm quote acceptance.
                </p>
              </div>

              <button
                type="button"
                className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setShowSignModal(false)}
                aria-label="Close"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-5 py-4">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ff6a00]/10 text-[#ff6a00]">
                    <LuPenTool className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <label className="block text-[13px] font-semibold text-slate-900">
                      Draw Your Signature
                    </label>
                    <p className="text-[12px] text-slate-500">
                      Use your mouse, trackpad, or touch screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[13px] font-semibold">
                  <button
                    type="button"
                    className="text-slate-600 transition hover:text-slate-900"
                    onClick={clearSignature}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#ff6a00] px-3 py-1.5 text-[#ff6a00] transition hover:bg-[#ff6a00] hover:text-white"
                    onClick={saveSignature}
                  >
                    <LuSignature className="h-4 w-4" />
                    Save Signature
                  </button>
                </div>
              </div>

              <div
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.22) 1px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              >
                <div className="mb-3 flex items-center justify-center gap-2 text-[13px] text-slate-400">
                  <LuPenTool className="h-4 w-4 text-slate-300" />
                  <span>Sign here</span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <SignaturePad
                    ref={sigPadRef}
                    redrawOnResize
                    canvasProps={{
                      "aria-label": "Draw your signature",
                      className: "touch-none",
                      style: {
                        display: "block",
                        width: "100%",
                        height: "clamp(180px, 40svh, 450px)",
                      },
                    }}
                    options={{
                      penColor: "black",
                      backgroundColor: "#fff",
                      minWidth: 1,
                      maxWidth: 1,
                    }}
                  />
                </div>

                <div className="mt-2 text-center text-[11px] text-slate-500">
                  Your signature will be used to accept the quote and create a
                  binding agreement.
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-[11px] font-semibold ${
                    signatureData
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <LuShieldCheck className="h-3.5 w-3.5" />
                  {signatureData ? "Signature saved" : "Signature required"}
                </div>

                {signatureData && (
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-slate-700">
                    <span className="font-semibold">Saved Signature Preview:</span>
                    <img
                      src={signatureData}
                      alt="Signature Preview"
                      className="h-12 max-w-32 rounded-lg border border-slate-200 bg-white object-contain p-2 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
            <button
              type="button"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              onClick={() => setShowSignModal(false)}
            >
              Cancel
            </button>
            <SubmitButton
              isLoading={signing}
              btnClass="rounded-xl bg-[#ff6a00] px-4 py-2 text-[13px] text-white shadow-sm transition hover:bg-[#ff7a1f]"
              btnName="Submit"
              isDisabled={isSubmitDisabled}
            />
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
