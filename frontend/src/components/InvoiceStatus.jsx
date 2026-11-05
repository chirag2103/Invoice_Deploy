import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { voidInvoice } from '../slices/invoiceSlice';
import './InvoiceStatus.css';

export const InvoiceStatus = ({ invoice }) => invoice.status === 'void' ? (
  <span className='invoice-void-details'>
    <span className='invoice-status invoice-status-void'>Void</span>
    <small>{invoice.voidReason}</small>
    {invoice.voidedAt && <small>Voided {new Date(invoice.voidedAt).toLocaleDateString('en-IN')}</small>}
  </span>
) : <span className='invoice-status invoice-status-active'>Active</span>;

export const VoidInvoiceButton = ({ invoice, onVoided }) => {
  const dispatch = useDispatch();
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (invoice.status === 'void') return null;
  const submit = async (event) => {
    event.preventDefault();
    if (!reason.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await dispatch(voidInvoice({ id: invoice._id, reason: reason.trim() })).unwrap();
      setOpen(false);
      toast.success('Invoice voided');
      onVoided?.();
    } catch (failure) {
      setError(typeof failure === 'string' ? failure : 'Unable to void invoice');
    } finally {
      setSaving(false);
    }
  };
  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && !saving) { event.stopPropagation(); close(); }
    if (event.key !== 'Tab') return;
    const controls = event.currentTarget.querySelectorAll('textarea:not(:disabled), button:not(:disabled)');
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return <>
    <button ref={triggerRef} type='button' className='delete-btn' onClick={() => setOpen(true)}>Void</button>
    {open && createPortal(<div className='invoice-void-overlay'>
      <section onKeyDown={handleKeyDown} role='dialog' aria-modal='true' aria-label={`Void invoice ${invoice.invoiceNo}`} className='invoice-void-dialog'>
        <h3>Void invoice {invoice.invoiceNo}</h3>
        <p>This keeps the invoice and its number but excludes its amount from balances and reports. Payments remain unchanged. This cannot be undone.</p>
        <form onSubmit={submit}>
          <label>Reason for voiding
            <textarea autoFocus required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} disabled={saving} />
          </label>
          {error && <p role='alert'>{error}</p>}
          <div className='invoice-void-actions'>
            <button type='button' disabled={saving} onClick={close}>Keep invoice</button>
            <button type='submit' className='delete-btn' disabled={saving || !reason.trim()}>{saving ? 'Voiding...' : 'Confirm void'}</button>
          </div>
        </form>
      </section>
    </div>, document.body)}
  </>;
};
