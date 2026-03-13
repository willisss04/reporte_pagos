import { useState } from 'react';
import axios from 'axios';
import { Search, DownloadCloud, CheckCircle, Clock, XCircle } from 'lucide-react';
import { downloadReceiptAsJPG } from '../utils/downloadReceipt';

export default function UserStatus() {
  const [paymentId, setPaymentId] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!paymentId) return;

    setLoading(true);
    setError('');
    setPaymentData(null);

    try {
      const res = await axios.get(`/api/payments/${paymentId}`);
      setPaymentData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al buscar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Consultar Estado de Pago</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Ingresa el número de ID que se te proporcionó al reportar tu pago para ver si ya fue aprobado y descargar tu recibo.
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input 
          type="number" 
          className="form-control" 
          placeholder="Ej. 1"
          value={paymentId}
          onChange={e => setPaymentId(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          <Search size={18} /> {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {paymentData && (
        <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: '#f8fafc' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Detalles del Reporte #{paymentData.id}</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span><strong>Estado:</strong></span>
            <span className={`badge badge-${paymentData.status.toLowerCase()}`} style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
              {paymentData.status === 'PENDING' && <><Clock size={14}/> Pendiente</>}
              {paymentData.status === 'APPROVED' && <><CheckCircle size={14}/> Aprobado</>}
              {paymentData.status === 'REJECTED' && <><XCircle size={14}/> Rechazado</>}
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
            <div><strong>Residente:</strong><br/>{paymentData.resident_name}</div>
            <div><strong>Apto:</strong><br/>{paymentData.apartment_id} (Torre {paymentData.tower})</div>
            <div><strong>Fecha reporte:</strong><br/>{new Date(paymentData.created_at).toLocaleDateString()}</div>
          </div>

          {paymentData.status === 'APPROVED' ? (
            <button 
              className="btn btn-accent" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} 
              onClick={() => downloadReceiptAsJPG(paymentData)}
            >
              <DownloadCloud size={18} /> Descargar Recibo JPG
            </button>
          ) : (
             <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
               El recibo estará disponible para descargar una vez que la administración apruebe el pago.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
