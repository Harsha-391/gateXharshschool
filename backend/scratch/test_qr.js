import QRCode from 'qrcode';
import path from 'path';

try {
  await QRCode.toFile('./test.jpg', 'test payload', {
    type: 'jpeg',
    color: {
      dark: '#1e1b4b',
      light: '#ffffff'
    },
    width: 300,
    margin: 2
  });
  console.log("Success");
} catch (err) {
  console.error("Error generating:", err);
}
