const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function runTest() {
  try {
    console.log('1. Fetching apartments...');
    const apts = await axios.get('http://localhost:3000/api/apartments');
    console.log(`Fetched ${apts.data.length} apartments`);
    
    const targetApt = apts.data.find(a => a.id === 'T1-1A');
    
    console.log('2. Submitting payment...');
    const formData = new FormData();
    formData.append('apartment_id', targetApt.id);
    formData.append('resident_name', 'Gerson Prueba');
    
    // We will upload the fake receipt we generated
    const imagePath = '/Users/estuardomunoz/.gemini/antigravity/brain/feaec65d-0cb8-49f6-a06e-6e60abd1b654/fake_bank_receipt_1773423537451.png';
    formData.append('receipt', fs.createReadStream(imagePath));
    
    const submitRes = await axios.post('http://localhost:3000/api/payments', formData, {
      headers: formData.getHeaders()
    });
    
    const paymentId = submitRes.data.payment_id;
    console.log(`Payment submitted successfully with ID: ${paymentId}`);

    console.log('3. Fetching admin payments...');
    const adminRes = await axios.get('http://localhost:3000/api/admin/payments');
    const payment = adminRes.data.find(p => p.id === paymentId);
    console.log(`Admin sees payment from ${payment.resident_name} for ${payment.apartment_id} with status ${payment.status}`);
    
    console.log('4. Approving payment...');
    await axios.patch(`http://localhost:3000/api/admin/payments/${paymentId}`, { status: 'APPROVED' });
    console.log(`Payment ${paymentId} approved.`);

    console.log('5. Verifying PDF link exists...');
    const pdfRes = await axios.get(`http://localhost:3000/api/payments/${paymentId}/pdf`, { responseType: 'stream' });
    if (pdfRes.status === 200) {
      console.log('PDF generation successful! Validation complete.');
    }
  } catch (err) {
    if (err.response) {
      console.error('Test Failed:', err.response.data);
    } else {
      console.error('Test Failed:', err.message);
    }
  }
}

runTest();
