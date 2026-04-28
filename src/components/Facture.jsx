import { useState } from "react";
import { fmMin, fmDate, moisLabel, todayFr } from "../App";

function getMonths(days) {
  const months = {};
  days.forEach(d => {
    const m = d.date.substring(0, 7);
    if (!months[m]) months[m] = true;
  });
  return Object.keys(months).sort();
}

export default function Facture({ days, cfg, clients }) {
  const months = getMonths(days);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedClient, setSelectedClient] = useState("tout");

  function toggleMois(m) {
    setSelectedMonths(sel => sel.includes(m) ? sel.filter(x => x !== m) : [...sel, m]);
  }

  const clientsInDays = clients.filter(c => days.some(d => String(d.clientId) === String(c.id)));

  let filteredDays = days;
  if (selectedMonths.length > 0) filteredDays = filteredDays.filter(d => selectedMonths.some(m => d.date.startsWith(m)));
  if (selectedClient !== "tout") filteredDays = filteredDays.filter(d => String(d.clientId) === String(selectedClient));

  const tvr       = parseFloat(cfg.tvap) || 21;
  const totalNet  = filteredDays.reduce((s, d) => s + d.net,  0);
  const totalHTVA = filteredDays.reduce((s, d) => s + d.htva, 0);
  const totalTVA  = totalHTVA * tvr / 100;
  const totalTTC  = totalHTVA + totalTVA;

  const periodeLabel = selectedMonths.length === 0
    ? (months.length > 0 ? months.map(m => moisLabel(m)).join(", ") : "—")
    : selectedMonths.sort().map(m => moisLabel(m)).join(" + ");

  const clientLabel = selectedClient !== "tout"
    ? clients.find(c => String(c.id) === selectedClient)?.nom || ""
    : "";

  const clientObj = selectedClient !== "tout"
    ? clients.find(c => String(c.id) === selectedClient)
    : null;

  const primary   = cfg.couleurPrimaire   || "#2d5a27";
  const secondary = cfg.couleurSecondaire || "#8b6914";

  return (
    <div>
      <div className="print-banner no-print">
        <div className="print-banner-title">🧾 Facture</div>
        <p className="print-banner-text">
          Sélectionnez le(s) mois et le client, puis imprimez.<br/>
          <strong>PC/Mac</strong> : Ctrl+P &nbsp;|&nbsp; <strong>iPhone</strong> : Partager → Imprimer
        </p>
        {months.length > 0 && (
          <div className="month-filter" style={{ marginBottom: "8px" }}>
            <button className={`month-btn light ${selectedMonths.length === 0 ? "on" : ""}`} onClick={() => setSelectedMonths([])}>Tout</button>
            {months.map(m => (
              <button key={m} className={`month-btn light ${selectedMonths.includes(m) ? "on" : ""}`} onClick={() => toggleMois(m)}>{moisLabel(m)}</button>
            ))}
          </div>
        )}
        {clientsInDays.length > 0 && (
          <div className="month-filter" style={{ marginBottom: "12px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: ".5px", alignSelf: "center", marginRight: "6px" }}>Client :</span>
            <button className={`month-btn light ${selectedClient === "tout" ? "on" : ""}`} onClick={() => setSelectedClient("tout")}>Tous</button>
            {clientsInDays.map(c => (
              <button key={c.id} className={`month-btn light ${selectedClient === String(c.id) ? "on" : ""}`} onClick={() => setSelectedClient(String(c.id))}>{c.nom}</button>
            ))}
          </div>
        )}
        <button className="btn print-btn" onClick={() => window.print()}>🖨️ Imprimer / Enregistrer en PDF</button>
      </div>

      {/* FACTURE */}
      <div className="facture-zone" style={{"--f-primary": primary, "--f-secondary": secondary}}>
        {/* EN-TÊTE */}
        <div className="f-header">
          <div className="f-left">
            {cfg.logo && <img src={cfg.logo} alt="logo" style={{height:"70px",marginBottom:"10px",display:"block",objectFit:"contain"}} />}
            <div className="f-name" style={{color: primary}}>{cfg.nom || "Votre Nom"}</div>
            <div className="f-tag" style={{color: secondary}}>{cfg.metier || "Indépendant"}</div>
            <div className="f-coords">
              {cfg.adr1  && <span>{cfg.adr1}<br/></span>}
              {cfg.adr2  && <span>{cfg.adr2}<br/></span>}
              {cfg.tel   && <span>📞 {cfg.tel}<br/></span>}
              {cfg.email && <span>✉️ {cfg.email}</span>}
            </div>
          </div>
          <div className="f-right">
            <div className="f-ref-title" style={{color: primary}}>FACTURE</div>
            <div className="f-ref-sub">
              N° {cfg.fnum || "—"}<br/>
              Date : {todayFr()}<br/>
              Période : {periodeLabel}
              {clientLabel && <><br/>Client : {clientLabel}</>}
            </div>
            {cfg.tva
              ? <div className="f-tva-badge" style={{background: secondary+"22", color: secondary, border: `1px solid ${secondary}44`}}>TVA : {cfg.tva}</div>
              : <div className="f-tva-warn">⚠️ N° TVA à compléter</div>}
            {cfg.bce && <div className="f-bce">BCE : {cfg.bce}</div>}
          </div>
        </div>

        {clientObj && (clientObj.adr1 || clientObj.adr2) && (
          <div style={{ background: "#f8f6f0", border: "1px solid #d4c4b0", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "11px" }}>
            <strong>Destinataire :</strong> {clientObj.nom}<br/>
            {clientObj.adr1 && <>{clientObj.adr1}<br/></>}
            {clientObj.adr2 && <>{clientObj.adr2}<br/></>}
            {clientObj.tva  && <>TVA : {clientObj.tva}</>}
          </div>
        )}

        <hr className="f-divider" style={{borderTopColor: primary}}/>

        <table className="f-table">
          <thead style={{background: primary}}>
            <tr>
              <th>Date</th><th>Horaire</th><th>H. nettes</th>
              <th>Client</th><th>Lieu</th><th>Travaux</th><th>Taux</th><th>HTVA</th>
            </tr>
          </thead>
          <tbody>
            {filteredDays.length ? filteredDays.map((d,i) => {
              const client = clients.find(c => String(c.id) === String(d.clientId));
              return (
                <tr key={d.id} style={{background: i%2===0?"#f8f6f0":"#fff"}}>
                  <td>{fmDate(d.date)}</td>
                  <td style={{fontFamily:"monospace"}}>{d.deb}–{d.fin}</td>
                  <td style={{textAlign:"center",fontWeight:"bold"}}>{fmMin(d.net)}</td>
                  <td>{client ? client.nom : "—"}</td>
                  <td>{d.lieu}</td>
                  <td>{d.trav||"—"}</td>
                  <td style={{textAlign:"right"}}>{d.taux?d.taux+"€/h":"—"}</td>
                  <td style={{textAlign:"right",fontWeight:"bold"}}>{d.htva.toFixed(2)} €</td>
                </tr>
              );
            }) : <tr><td colSpan={8} style={{textAlign:"center",color:"#999",padding:"14px"}}>Aucune prestation</td></tr>}
          </tbody>
          <tfoot>
            <tr className="f-total-row" style={{background: secondary+"33"}}>
              <td colSpan={2}><strong>TOTAUX</strong></td>
              <td style={{textAlign:"center"}}><strong>{fmMin(totalNet)}</strong></td>
              <td colSpan={4}></td>
              <td style={{textAlign:"right"}}><strong>{totalHTVA.toFixed(2)} €</strong></td>
            </tr>
          </tfoot>
        </table>

        <div className="f-totals-wrap">
          <table className="f-totals">
            <tbody>
              <tr><td>Total HTVA</td><td>{totalHTVA.toFixed(2)} €</td></tr>
              <tr><td>TVA {tvr}%</td><td>{totalTVA.toFixed(2)} €</td></tr>
              <tr className="f-grand" style={{background: primary}}>
                <td><strong>TOTAL TTC</strong></td>
                <td><strong>{totalTTC.toFixed(2)} €</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {(cfg.iban || cfg.bic) && (
          <div className="f-payment">
            <strong>💳 Paiement</strong><br/>
            {cfg.iban && <>IBAN : <code>{cfg.iban}</code> </>}
            {cfg.bic  && <>BIC : <code>{cfg.bic}</code></>}
          </div>
        )}

        <div className="f-footer">
          {cfg.nom||"—"} · {cfg.metier||"Indépendant"}
          {cfg.tva ? ` · TVA : ${cfg.tva}` : ""}
          {cfg.bce ? ` · BCE : ${cfg.bce}` : ""}
          {" · "}Généré le {todayFr()}
        </div>
      </div>
    </div>
  );
}
