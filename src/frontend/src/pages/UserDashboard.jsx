import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, UploadCloud } from 'lucide-react';

export default function UserDashboard() {
  const [apartments, setApartments] = useState([]);
  const [selectedTower, setSelectedTower] = useState('');
  const [selectedApartment, setSelectedApartment] = useState('');
  const [residentName, setResidentName] = useState('');
  const [paymentMonth, setPaymentMonth] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch apartments on mount
  useEffect(() => {
    axios.get('/api/apartments')
      .then(res => setApartments(res.data))
      .catch(err => console.error('Error fetching apartments', err));
  }, []);

  // Distinct towers
  const towers = [...new Set(apartments.map(a => a.tower))].sort((a,b) => a - b);
  // Apartments for selected tower
  const availableApts = apartments.filter(a => a.tower === parseInt(selectedTower));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApartment || !residentName || !paymentMonth || !file) {
      setError('Por favor completa todos los campos y adjunta la imagen.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('apartment_id', selectedApartment);
    formData.append('resident_name', residentName);
    formData.append('payment_month', paymentMonth);
    formData.append('receipt', file);

    try {
      const res = await axios.post('/api/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(res.data.payment_id);
      // Reset form
      setSelectedTower('');
      setSelectedApartment('');
      setResidentName('');
      setPaymentMonth('');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el reporte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '3rem' }}>
        <CheckCircle size={64} color="var(--accent-color)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ marginBottom: '1rem' }}>¡Reporte Enviado!</h2>
        <div style={{ padding: '1rem', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
          Tu ID de Pago es: #{success}
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Por favor, guarda este ID. Puedes usarlo en la sección "Consultar Estado" para verificar si fue aprobado y descargar tu recibo.
        </p>
        <button className="btn btn-primary" onClick={() => setSuccess(false)}>
          Reportar otro pago
        </button>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Reportar Pago de Servicios</h2>
      
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Torre</label>
            <select 
              className="form-control"
              value={selectedTower} 
              onChange={e => { setSelectedTower(e.target.value); setSelectedApartment(''); }}
              required
            >
              <option value="">Selecciona una torre</option>
              {towers.map(t => (
                <option key={t} value={t}>Torre {t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Apartamento</label>
            <select 
              className="form-control"
              value={selectedApartment} 
              onChange={e => setSelectedApartment(e.target.value)}
              disabled={!selectedTower}
              required
            >
              <option value="">Selecciona apartamento</option>
              {availableApts.map(a => (
                <option key={a.id} value={a.id}>{a.id} (Nivel {a.level})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nombre del Residente</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Ej. Juan Pérez"
            value={residentName}
            onChange={e => setResidentName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mes a Pagar</label>
          <select 
            className="form-control"
            value={paymentMonth} 
            onChange={e => setPaymentMonth(e.target.value)}
            required
          >
            <option value="">Selecciona el mes...</option>
            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Comprobante de Pago (Imagen)</label>
          <label className="file-upload">
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setFile(e.target.files[0])}
              required
              style={{ display: 'none' }}
            />
            <UploadCloud size={32} color="var(--secondary-color)" />
            <div className="file-upload-text">
              {file ? file.name : 'Haz clic o arrastra tu imagen aquí'}
            </div>
          </label>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
        </button>
      </form>
    </div>
  );
}
