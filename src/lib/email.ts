import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotificacaoNovoLoteParams {
  funcionarioEmail: string;
  funcionarioNome: string;
  nicho: string;
  totalLeads: number;
  dataProspeccao: string;
  adminNome: string;
}

export async function enviarNotificacaoNovoLote({
  funcionarioEmail,
  funcionarioNome,
  nicho,
  totalLeads,
  dataProspeccao,
  adminNome,
}: NotificacaoNovoLoteParams) {
  const dataFormatada = new Date(dataProspeccao).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  await resend.emails.send({
    from: "Yuntrix <onboarding@resend.dev>",
    to: funcionarioEmail,
    subject: `Novos leads atribuídos — ${nicho} (${totalLeads} contatos)`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #141b2b;">

        <div style="background: #004ac6; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 600;">
            Yuntrix
          </h1>
          <p style="color: #b4c5ff; font-size: 13px; margin: 4px 0 0;">
            CRM de Prospecção
          </p>
        </div>

        <div style="background: #ffffff; padding: 32px; border: 1px solid #e1e8fd; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin: 0 0 8px;">Olá, <strong>${funcionarioNome}</strong></p>

          <p style="font-size: 15px; color: #434655; margin: 0 0 24px;">
            ${adminNome} atribuiu um novo lote de leads para você. Acesse o sistema
            para começar os contatos.
          </p>

          <div style="background: #f1f3ff; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 13px; color: #737686; padding: 6px 0;">Nicho</td>
                <td style="font-size: 14px; font-weight: 600; color: #141b2b; text-align: right; padding: 6px 0;">${nicho}</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #737686; padding: 6px 0; border-top: 1px solid #e1e8fd;">Total de leads</td>
                <td style="font-size: 14px; font-weight: 600; color: #004ac6; text-align: right; padding: 6px 0; border-top: 1px solid #e1e8fd;">${totalLeads} contatos</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #737686; padding: 6px 0; border-top: 1px solid #e1e8fd;">Data de prospecção</td>
                <td style="font-size: 14px; color: #141b2b; text-align: right; padding: 6px 0; border-top: 1px solid #e1e8fd;">${dataFormatada}</td>
              </tr>
            </table>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="display: block; background: #004ac6; color: #ffffff; text-align: center;
                    padding: 14px 24px; border-radius: 8px; font-size: 15px;
                    font-weight: 600; text-decoration: none;">
            Ver meus leads →
          </a>

          <p style="font-size: 12px; color: #737686; margin: 24px 0 0; text-align: center;">
            Você recebeu este e-mail porque tem uma conta no Yuntrix.<br>
            Em caso de dúvidas, fale com seu administrador.
          </p>
        </div>

      </div>
    `,
  });
}
