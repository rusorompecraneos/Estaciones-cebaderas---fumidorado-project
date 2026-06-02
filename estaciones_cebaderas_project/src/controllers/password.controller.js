import smsService from '../services/sms.service.js';
import bcrypt     from 'bcryptjs';
import passwordRepository from '../repositories/password.repository.js';


// Función para generar código de 6 dígitos
const generarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── VISTA 1: Mostrar formulario de teléfono ───────────────────
const mostrarRecuperar = (req, res) => {
  res.render('password/recuperar-password', { error: null });
};

// ── POST 1: Validar teléfono y enviar SMS ─────────────────────
const enviarCodigo = async (req, res) => {
  const { telefono } = req.body;

  // Validación del teléfono
  if (!telefono || !/^\d{10}$/.test(telefono.trim())) {
    return res.render('password/recuperar-password', {
      error: 'Ingresa un número celular colombiano válido de 10 dígitos.'
    });
  }

  const usuario =
    await passwordRepository.buscarAdminPorTelefono(
      telefono.trim()
    );

  if (!usuario) {
    return res.render(
      'password/recuperar-password',
      {
        error: 'No existe una cuenta asociada a ese número.'
      }
    );
  }

  const codigo = generarCodigo();

  req.session.recuperacion = {
    usuarioId: usuario.id,
    telefono: usuario.telefono,
    codigo,
    verificado: false,
    expira: Date.now() + 10 * 60 * 1000
  };

  const resultado =
    await smsService.enviarCodigoSMS(
      usuario.telefono,
      codigo
    );



  if (!resultado.ok) {
    return res.render('password/recuperar-password', {
      error: 'No se pudo enviar el SMS. Intenta de nuevo.'
    });
  }

  console.log(`📱 Código enviado a +57${telefono}: ${codigo}`);
  console.log('SESION GUARDADA:', req.session.recuperacion);

  res.redirect('/password/verificar');

};

// ── VISTA 2: Mostrar formulario de verificación ───────────────
const mostrarVerificar = (req, res) => {
    console.log('SESION EN VERIFICAR:', req.session.recuperacion);

  if (!req.session.recuperacion) {
    return res.redirect('/password/recuperar');
  }

  const tel = req.session.recuperacion.telefono;
  const enmascarado = '+57 ' + tel.substring(0, 3) + '*'.repeat(tel.length - 3);

  res.render('password/verificar-codigo', { error: null, telefono: enmascarado });
};

// ── POST 2: Verificar el código ───────────────────────────────
const verificarCodigo = (req, res) => {
  const sesion = req.session.recuperacion;
    console.log('SESION AL VALIDAR CODIGO:', req.session.recuperacion);
  if (!sesion) return res.redirect('/password/recuperar');

  // Verificar expiración
  if (Date.now() > sesion.expira) {
    req.session.recuperacion = null;
    return res.render('password/recuperar-password', {
      error: 'El código expiró. Solicita uno nuevo.'
    });
  }

  const codigoIngresado = [
    req.body.d1, req.body.d2, req.body.d3,
    req.body.d4, req.body.d5, req.body.d6
  ].join('');

  // Validar que sean 6 dígitos
  if (!/^\d{6}$/.test(codigoIngresado)) {
    const tel = sesion.telefono;
    const enmascarado = '+57 ' + tel.substring(0, 3) + '*'.repeat(tel.length - 3);
    return res.render('password/verificar-codigo', {
      error: 'Ingresa los 6 dígitos del código.',
      telefono: enmascarado
    });
  }

  if (codigoIngresado !== sesion.codigo) {
    const tel = sesion.telefono;
    const enmascarado = '+57 ' + tel.substring(0, 3) + '*'.repeat(tel.length - 3);
    return res.render('password/verificar-codigo', {
      error: 'Código incorrecto. Intenta de nuevo.',
      telefono: enmascarado
    });
  }

  // Código correcto
  req.session.recuperacion.verificado = true;
  res.redirect('/password/nueva-password');
};

// ── VISTA 3: Mostrar formulario de nueva contraseña ───────────
const mostrarNuevaPassword = (req, res) => {
  const sesion = req.session.recuperacion;
  if (!sesion || !sesion.verificado) return res.redirect('/password/recuperar');
  res.render('password/nueva-password', { error: null });
};

// ── POST 3: Guardar nueva contraseña ─────────────────────────
const actualizarPassword = async (req, res) => {
  const sesion = req.session.recuperacion;
  if (!sesion || !sesion.verificado) return res.redirect('/password/recuperar');

  const { nueva_password, confirmar_password } = req.body;
  const errores = [];

  if (!nueva_password || nueva_password.length < 6) {
    errores.push('La contraseña debe tener mínimo 6 caracteres.');
  }
  if (nueva_password !== confirmar_password) {
    errores.push('Las contraseñas no coinciden.');
  }

  if (errores.length > 0) {
    return res.render('password/nueva-password', { error: errores[0] });
  }

  const hash = await bcrypt.hash(nueva_password, 10);

  // TODO: cuando esté la BD, actualizar la contraseña:
await passwordRepository.actualizarPassword(
  sesion.usuarioId,
  hash
);

  console.log(`✅ Contraseña actualizada para: ${sesion.telefono}`);
  console.log(`🔐 Hash: ${hash}`);

  req.session.recuperacion = null;
  res.redirect('/password/confirmacion');
};

// ── VISTA 4: Confirmación ─────────────────────────────────────
const mostrarConfirmacion = (req, res) => {
  res.render('password/password-actualizado');
};

// ── Reenviar código ───────────────────────────────────────────
const reenviarCodigo = async (req, res) => {
  const sesion = req.session.recuperacion;
  if (!sesion) return res.redirect('/password/recuperar');

  const codigo = generarCodigo();
  req.session.recuperacion.codigo  = codigo;
  req.session.recuperacion.expira  = Date.now() + 10 * 60 * 1000;
  req.session.recuperacion.verificado = false;

  await smsService.enviarCodigoSMS(sesion.telefono, codigo);
  console.log(`🔁 Código reenviado a +57${sesion.telefono}: ${codigo}`);

  res.redirect('/password/verificar');
};

export default {
  mostrarRecuperar,
  enviarCodigo,
  mostrarVerificar,
  verificarCodigo,
  mostrarNuevaPassword,
  actualizarPassword,
  mostrarConfirmacion,
  reenviarCodigo
};