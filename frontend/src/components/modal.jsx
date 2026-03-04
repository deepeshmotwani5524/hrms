import { Icon } from "../utility/icons";

export default function Modal({ title, onClose, children, footer }) {
    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-handle" />
                <div className="modal-hd">
                <span className="modal-title">{title}</span>
                <button className="btn btn-secondary btn-sm" onClick={onClose}><Icon name="x" size={14} /></button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-ft">{footer}</div>}
            </div>
        </div>
    );
}