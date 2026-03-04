import { Icon } from "../utility/icons";


export default function Alert({ type, children, onClose }) {
    return (
        <div className={`alert alert-${type}`}>
            <Icon name={type === "error" ? "alert" : "check"} size={14} />
            <span style={{ flex: 1 }}>{children}</span>
            {onClose && (
                <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"inherit", padding:0, flexShrink:0 }}>
                <Icon name="x" size={14} />
                </button>
            )}
        </div>
    );
}