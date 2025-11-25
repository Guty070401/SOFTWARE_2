# Configuración SMTP para verificaciones de correo

El backend usa Nodemailer con las variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM`.
Rellena el secreto `infra/k8s/manifests/backend-secrets.yaml` con valores reales de tu proveedor (no uses los placeholders `${...}`).

## Ejemplos rápidos
- **AWS SES**: `SMTP_HOST=email-smtp.<region>.amazonaws.com`, `SMTP_PORT=465` o `587`, `SMTP_USER` y `SMTP_PASS` del usuario SMTP de SES, `SMTP_FROM` con un dominio verificado.
- **SendGrid**: `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`, `SMTP_USER=apikey`, `SMTP_PASS=<API_KEY>`, `SMTP_FROM` con un remitente verificado en SendGrid.
- **Resend**: `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=587`, `SMTP_USER=resend`, `SMTP_PASS=<API_KEY>`, `SMTP_FROM` con un dominio remitente verificado.

## Consejos
- Usa `465` para TLS implícito o `587` para STARTTLS; habilita el puerto que soporte tu proveedor.
- Mantén las credenciales en el secreto de Kubernetes y no en texto plano en los manifiestos.
- Asegúrate de que el dominio de `SMTP_FROM` esté validado en tu proveedor para evitar rebotes.
