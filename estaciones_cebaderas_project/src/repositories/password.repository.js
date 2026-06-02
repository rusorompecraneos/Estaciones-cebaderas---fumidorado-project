import pool from '../config/db.config.js';

const buscarAdminPorTelefono = async (telefono) => {
  const result = await pool.query(
    `
    SELECT id, username, nombre, telefono
    FROM administradores
    WHERE telefono = $1
    `,
    [telefono]
  );

  return result.rows[0] || null;
};

const actualizarPassword = async (
  id,
  passwordHash
) => {
  await pool.query(
    `
    UPDATE administradores
    SET password = $1
    WHERE id = $2
    `,
    [passwordHash, id]
  );
};

export default {
  buscarAdminPorTelefono,
  actualizarPassword
};