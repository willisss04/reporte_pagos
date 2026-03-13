const fs = require('fs');
const file = '../frontend/src/pages/AdminDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const handleDownloadPdf = (id) => {
    window.open(\`http://localhost:3000/api/payments/\${id}/pdf\`, '_blank');
  };`;

const replacement = `  const handleDownloadPdf = async (id) => {
    try {
      const response = await axios.get(\`http://localhost:3000/api/payments/\${id}/pdf\`, {
        responseType: 'blob',
        ...getAxiosConfig()
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', \`Recibo_Pago_Torres_Petapa_\${id}.pdf\`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Error descargando el recibo.');
    }
  };`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
