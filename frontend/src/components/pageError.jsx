import { Icon } from "../utility/icons";

export function PageError({ message, onRetry }) {
    return (
        <div className="page-error">
            <div className="page-error-icon"><Icon name="wifi_off" size={26} /></div>
            <div className="page-error-title">Failed to load data</div>
            <div className="page-error-msg">{message}</div>
            {onRetry && (
                <button className="btn btn-primary" onClick={onRetry}>
                <Icon name="reload" size={14} /> Retry
                </button>
            )}
        </div>
    );
}