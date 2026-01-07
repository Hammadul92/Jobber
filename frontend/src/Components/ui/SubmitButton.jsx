export default function SubmitButton({ btnClass, isLoading, btnName, isDisabled }) {
    return (
        <button type="submit" className={`${btnClass} bg-gradient`} disabled={isLoading || isDisabled}>
            {isLoading ? (
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            ) : null}{' '}
            {btnName}
        </button>
    );
}
