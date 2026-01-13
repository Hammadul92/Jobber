export default function SubmitButton({ btnClass = '', isLoading, btnName, isDisabled }) {
    return (
        <button
            type="submit"
            className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60 ${btnClass}`}
            disabled={isLoading || isDisabled}
        >
            {isLoading && (
                <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"
                    aria-hidden="true"
                ></span>
            )}
            <span>{btnName}</span>
        </button>
    );
}
