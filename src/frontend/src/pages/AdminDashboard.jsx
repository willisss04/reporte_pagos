import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DownloadCloud, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { downloadReceiptAsJPG } from '../utils/downloadReceipt';

export default function AdminDashboard() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const getAxiosConfig = () => {
    return { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get('/api/admin/payments', getAxiosConfig());
      setPayments(res.data);
    } catch (err) {
      console.error('Error fetching payments:', err);
      // Kick user back to login if unauthorized
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check local token first
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin');
      return;
    }
    fetchPayments();
  }, [navigate]);

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`/api/admin/payments/${id}`, { status }, getAxiosConfig());
      // update local state
      setPayments(payments.map(p => p.id === id ? { ...p, status } : p));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating status');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Verificando acceso...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--primary-color)' }}>Panel de Administración</h2>
        <button className="btn btn-secondary" onClick={handleLogout}>
          <LogOut size={16} /> Salir
        </button>
      </div>
      
      {payments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No hay pagos reportados todavía.
        </div>
      ) : (
        <div className="grid-cols-3">
          {payments.map(payment => (
            <div key={payment.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className={`badge badge-${payment.status.toLowerCase()}`}>
                  {payment.status === 'PENDING' ? 'Pendiente' : payment.status === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {new Date(payment.created_at).toLocaleDateString()}
                </span>
              </div>

              <a href={`/${payment.receipt_image}`} target="_blank" rel="noreferrer">
                <img 
                  src={`/${payment.receipt_image}`} 
                  alt="Comprobante" 
                  className="payment-card-img" 
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Sin+Imagen' }}
                />
              </a>

              <div className="payment-details">
                <p><strong>Apto:</strong> {payment.apartment_id} (Torre {payment.tower})</p>
                <p><strong>Residente:</strong> {payment.resident_name}</p>
                <p><strong>Mes:</strong> {payment.payment_month || 'N/A'}</p>
                <p><strong>ID PAGO:</strong> #{payment.id}</p>
              </div>

              {payment.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button 
                    className="btn btn-accent" 
                    style={{ flex: 1 }}
                    onClick={() => handleStatusChange(payment.id, 'APPROVED')}
                  >
                    <CheckCircle size={16} /> Aprobar
                  </button>
                  <button 
                    className="btn btn-danger" 
                    style={{ flex: 1 }}
                    onClick={() => handleStatusChange(payment.id, 'REJECTED')}
                  >
                    <XCircle size={16} /> Rechazar
                  </button>
                </div>
              )}

              {payment.status === 'APPROVED' && (
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={() => downloadReceiptAsJPG(payment)}
                >
                  <DownloadCloud size={16} /> Descargar Recibo JPG
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
