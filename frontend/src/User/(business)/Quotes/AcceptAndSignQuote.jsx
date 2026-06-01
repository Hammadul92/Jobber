import { useRef, useState } from "react";
import SignaturePad from "react-signature-pad-wrapper";
import SubmitButton from "../../../Components/ui/SubmitButton";
import { LuPenTool, LuSignature, LuShieldCheck, LuX } from "react-icons/lu";

export default function AcceptAndSignQuote({
  setShowSignModal,
  handleSignSubmit,
  signing,
}) {
  const [signatureData, setSignatureData] = useState(null);
  const sigPadRef = useRef(null);

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
    handleSignSubmit({ signature: signatureData });
  };

  const isSubmitDisabled = !signatureData;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full md:w-1/2 lg:w-2/3 max-w-140 overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <form onSubmit={onSubmit}>
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h5 className="text-[22px] font-semibold tracking-tight text-slate-900">
                  Accept & Sign Quote
                </h5>
                <p className="mt-1 text-xs text-slate-500">
                  Draw your signature below to confirm quote acceptance.
                </p>
              </div>

              <button
                type="button"
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
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
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff6a00]/10 text-[#ff6a00]">
                    <LuPenTool className="h-4 w-4" />
                  </span>
                  <div>
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
                    canvasProps={{
                      style: {
                        display: "block",
                        width: "100%",
                        height: "450px",
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

              <div className="mt-3 flex items-center justify-between gap-3">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${
                    signatureData
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <LuShieldCheck className="h-3.5 w-3.5" />
                  {signatureData ? "Signature saved" : "Signature required"}
                </div>

                {signatureData && (
                  <div className="flex items-center gap-2 text-[13px] text-slate-700">
                    <span className="font-semibold">Saved Signature Preview:</span>
                    <img
                      src={signatureData}
                      alt="Signature Preview"
                      className="h-12 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
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
  );
}
