import React from "react";

const ProfileSettings = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Configuración de Perfil</h1>
      <p>Aquí podrás personalizar tus preferencias, notificaciones y demás ajustes.</p>

      <div style={{ marginTop: "2rem" }}>
        <h3>Datos del usuario:</h3>
        <p><strong>Nombre:</strong> {/* luego lo traeremos del store */}</p>
        <p><strong>Email:</strong></p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Preferencias:</h3>
        <label>
          <input type="checkbox" /> Recibir notificaciones
        </label>
      </div>
    </div>
  );
};

export default ProfileSettings;
