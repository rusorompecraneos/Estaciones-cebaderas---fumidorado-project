import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const enviarCodigoSMS = async (telefono, codigo) => {
  try {
    await client.messages.create({
      body: `Fumi Dorado S.A.S: Tu código de verificación es: ${codigo}. Válido por 10 minutos.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+57${telefono}`
    });

    return { ok: true };

  } catch (error) {

    console.error('Error enviando SMS:', error.message);

    return {
      ok: false,
      error: error.message
    };
  }
};

export default { enviarCodigoSMS };