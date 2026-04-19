import { useState } from "react";
import { fmMin, fmDate, moisLabel } from "../App";

function getMonths(days) {
  const months = {};
  days.forEach(d => {
    const m = d.date.substring(0, 7);
    if (!months[m]) months[m] = true;
  });
  return Object.keys(months).sort();
}

export default function Journal({ days, cfg, clients, onDelete, onClear, onFacture, onEdit, onCopy, onArchiver }) {
  const [filterMois, setFilterMois] = useState("tout");
  const [filterClient, setFilterClient] = useState("tout");

  const months = getMonths(days);

  // Clients présents dans le journal
  const clientsInJournal = clients.filter(c =>
    days.some(d => d.clientId === String(c.id) || d.clientId === c.id)
  );

  let filteredDays = days;
  if (filterMois !== "tout") filteredDays = filteredDays.filter(d => d.date.startsWith(filterMois));
  if (filterClient !== "tout") filteredDays = filteredDays.filter(d => String(d.clientId) === String(filterClient));

  const totalNet  = filteredDays.reduce((s, d) => s + d.net,  0);
  const totalHTVA = filteredDays.reduce((s, d) => s + d.htva, 0);

  function handlePrint() { window.print(); }

  return (
    <div>
      <div className="stats-grid">
        <Stat value={filteredDays.length}                                    label="Jours prestés" />
        <Stat value={fmMin(totalNet)}                                        label="Heures facturables" />
        <Stat value={totalHTVA.toFixed(2).replace(".", ",") + " €"}         label="Total HTVA" />
      </div>

      <div className="card">
        <div className="card-title">📋 Journal des prestations</div>

        {/* FILTRE MOIS */}
        {months.length > 0 && (
          <div className="month-filter no-print">
            <button className={`month-btn ${filterMois === "tout" ? "on" : ""}`} onClick={() => setFilterMois("tout")}>Tout</button>
            {months.map(m => (
              <button key={m} className={`month-btn ${filterMois === m ? "on" : ""}`} onClick={() => setFilterMois(m)}>{moisLabel(m)}</button>
            ))}
          </div>
        )}

        {/* FILTRE CLIENT */}
        {clientsInJournal.length > 1 && (
          <div className="month-filter no-print" style={{ marginTop: "6px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: ".5px", color: "#9a8878", marginRight: "6px", alignSelf: "center" }}>Client :</span>
            <button className={`month-btn ${filterClient === "tout" ? "on" : ""}`} onClick={() => setFilterClient("tout")}>Tous</button>
            {clientsInJournal.map(c => (
              <button key={c.id} className={`month-btn ${String(filterClient) === String(c.id) ? "on" : ""}`} onClick={() => setFilterClient(String(c.id))}>{c.nom}</button>
            ))}
          </div>
        )}

        {/* TITRE IMPRESSION */}
        <div className="print-only journal-print-title">
          Journal — {filterMois === "tout" ? "Tous les mois" : moisLabel(filterMois)}
          {filterClient !== "tout" && clients.find(c => String(c.id) === filterClient)
            ? ` · ${clients.find(c => String(c.id) === filterClient).nom}` : ""}
          {cfg.nom && <span style={{ float: "right" }}>{cfg.nom}</span>}
        </div>

        {!filteredDays.length ? (
          <div className="empty">🌾 Aucune prestation pour cette période.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Dép.</th><th>Fin</th><th>Pause</th><th>H.nettes</th>
                  <th>Client</th><th>Lieu</th><th>Travaux</th><th>HTVA</th>
                  <th className="no-print"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDays.map(d => {
                  const client = clients.find(c => String(c.id) === String(d.clientId));
                  return (
                    <>
                      <tr key={d.id}>
                        <td className="mono">{fmDate(d.date)}</td>
                        <td className="mono">{d.deb}</td>
                        <td className="mono">{d.fin}</td>
                        <td className="mono">{d.pause||30}min</td>
                        <td className="mono bold">{fmMin(d.net)}</td>
                        <td>{client ? client.nom : "—"}</td>
                        <td>{d.lieu}</td>
                        <td>{d.trav||"—"}</td>
                        <td className="mono bold">{d.htva.toFixed(2)} €</td>
                        <td className="no-print">
                          <div style={{ display: "flex", gap: "3px" }}>
                            <button className="btn-icon edit" title="Modifier" onClick={() => onEdit(d)}>✏️</button>
                            <button className="btn-icon copy" title="Copier" onClick={() => onCopy(d)}>📋</button>
                            <button className="btn-icon delete" title="Supprimer"
                              onClick={() => { if (window.confirm("Supprimer ?")) onDelete(d.id); }}>✕</button>
                          </div>
                        </td>
                      </tr>
                      {d.note && (
                        <tr key={`note-${d.id}`} className="note-row">
                          <td colSpan={10} className="note-cell no-print">📝 <em>{d.note}</em></td>
                          <td colSpan={10} className="note-cell print-only">📝 <em>{d.note}</em></td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan={4}><strong>TOTAUX</strong></td>
                  <td className="mono"><strong>{fmMin(totalNet)}</strong></td>
                  <td colSpan={3}></td>
                  <td className="mono"><strong>{totalHTVA.toFixed(2)} €</strong></td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="acts no-print">
        <button className="btn wheat" onClick={onFacture}>🧾 Voir la facture</button>
        <button className="btn primary" onClick={handlePrint}>🖨️ Imprimer le journal</button>
        {days.length > 0 && (
          <button className="btn archive" onClick={() => {
            if (window.confirm(`Archiver le mois et commencer un nouveau mois ?\nLes journées actuelles seront déplacées dans l'historique.`))
              onArchiver();
          }}>🗂️ Archiver le mois</button>
        )}
        {days.length > 0 && (
          <button className="btn danger small"
            onClick={() => { if (window.confirm("Effacer TOUTES les journées ?")) onClear(); }}>
            🗑️ Tout effacer
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
