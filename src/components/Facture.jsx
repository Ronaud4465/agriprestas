import { fmMin, fmDate, moisLabel, todayFr } from "../App";

export default function Facture({ days, cfg }) {
  const tvr       = parseFloat(cfg.tvap) || 21;
  const totalNet  = days.reduce((s, d) => s + d.net,  0);
  const totalHTVA = days.reduce((s, d) => s + d.htva, 0);
  const totalTVA  = totalHTVA * tvr / 100;
  const totalTTC  = totalHTVA + totalTVA;

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <div className="print-banner no-print">
        <div className="print-banner-title">📄 Facture du mois</div>
        <p className="print-banner-text">
          <strong>PC / Mac</strong> : appuyez sur <strong>Ctrl+P</strong> (ou Cmd+P) — sélectionnez "Enregistrer en PDF" ou votre imprimante.<br />
          <strong>iPhone / Android</strong> : menu du navigateur → "Partager" → "Imprimer" ou "Enregistrer en PDF".
        </p>
        <button className="btn print-btn" onClick={handlePrint}>🖨️ Imprimer / Enregistrer en PDF</button>
      </div>

      <div className="facture-zone" id="facture-print">
        {/* EN-TÊTE */}
        <div className="f-header">
          <div className="f-left">
            <div className="f-name">{cfg.nom || "Votre Nom"}</div>
            <div className="f-tag">🚜 {cfg.metier || "Conductrice de tracteur indépendante"}</div>
            <div className="f-coords">
              {cfg.adr1 && <span>{cfg.adr1}<br /></span>}
              {cfg.adr2 && <span>{cfg.adr2}<br /></span>}
              {cfg.tel  && <span>📞 {cfg.tel}<br /></span>}
              {cfg.email && <span>✉️ {cfg.email}</span>}
            </div>
          </div>
          <div className="f-right">
            <div className="f-ref-title">FACTURE</div>
            <div className="f-ref-sub">
              N° {cfg.fnum || "—"}<br />
              Date : {todayFr()}<br />
              Période : {moisLabel(cfg.mois)}
            </div>
            {cfg.tva
              ? <div className="f-tva-badge">TVA : {cfg.tva}</div>
              : <div className="f-tva-warn">⚠️ N° TVA à compléter</div>}
            {cfg.bce && <div className="f-bce">BCE : {cfg.bce}</div>}
          </div>
        </div>

        <hr className="f-divider" />

        {/* TABLEAU */}
        <table className="f-table">
          <thead>
            <tr>
              <th>Date</th><th>Horaire</th><th>H. nettes</th>
              <th>Lieu / Chantier</th><th>Travaux</th><th>Taux</th><th>Montant HTVA</th>
            </tr>
          </thead>
          <tbody>
            {days.length ? days.map((d, i) => (
              <tr key={d.id} style={{ background: i % 2 === 0 ? "#faf6ef" : "#fff" }}>
                <td>{fmDate(d.date)}</td>
                <td style={{ fontFamily: "monospace" }}>{d.deb}–{d.fin}</td>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>{fmMin(d.net)}</td>
                <td>{d.lieu}</td>
                <td>{d.trav || "—"}</td>
                <td style={{ textAlign: "right" }}>{d.taux ? d.taux + "€/h" : "—"}</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>{d.htva.toFixed(2)} €</td>
              </tr>
            )) : (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "#999", padding: "14px" }}>Aucune prestation enregistrée</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="f-total-row">
              <td colSpan={2}><strong>TOTAUX</strong></td>
              <td style={{ textAlign: "center" }}><strong>{fmMin(totalNet)}</strong></td>
              <td colSpan={3}></td>
              <td style={{ textAlign: "right" }}><strong>{totalHTVA.toFixed(2)} €</strong></td>
            </tr>
          </tfoot>
        </table>

        {/* TOTAUX */}
        <div className="f-totals-wrap">
          <table className="f-totals">
            <tbody>
              <tr><td>Total HTVA</td><td>{totalHTVA.toFixed(2)} €</td></tr>
              <tr><td>TVA {tvr}%</td><td>{totalTVA.toFixed(2)} €</td></tr>
              <tr className="f-grand"><td><strong>TOTAL TTC</strong></td><td><strong>{totalTTC.toFixed(2)} €</strong></td></tr>
            </tbody>
          </table>
        </div>

        {/* PAIEMENT */}
        {(cfg.iban || cfg.bic) && (
          <div className="f-payment">
            <strong>💳 Coordonnées de paiement</strong><br />
            {cfg.iban && <>IBAN : <code>{cfg.iban}</code> </>}
            {cfg.bic  && <>BIC : <code>{cfg.bic}</code></>}
          </div>
        )}

        <div className="f-footer">
          {cfg.nom || "—"} · {cfg.metier || "Conductrice indépendante"}
          {cfg.tva ? ` · TVA : ${cfg.tva}` : ""}
          {cfg.bce ? ` · BCE : ${cfg.bce}` : ""}
          {" · "}Facture générée le {todayFr()}
        </div>
      </div>
    </div>
  );
}
