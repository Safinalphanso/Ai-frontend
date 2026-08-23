import { useCallback, useEffect, useState } from "react";
import { api, API_URL } from "./api";
import { DEMO_PRESETS } from "./presets";
import "./App.css";

const TABS = [
  { id: "all", label: "All tasks" },
  { id: "week", label: "Due this week" },
  { id: "confirm", label: "Needs confirmation" },
];

function App() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [text, setText] = useState("");
  const [source, setSource] = useState("whatsapp");
  const [receivedAt, setReceivedAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [tab, setTab] = useState("all");
  const [tasks, setTasks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState(null);

  const refreshHealth = useCallback(async () => {
    try {
      const data = await api.health();
      setApiStatus(data.message || "connected");
    } catch (err) {
      setApiStatus(`offline: ${err.message}`);
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      let data;
      if (tab === "week") data = await api.dueThisWeek();
      else if (tab === "confirm") data = await api.needsConfirmation();
      else data = await api.listTasks();
      setTasks(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [tab]);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  function applyPreset(preset) {
    setText(preset.text);
    setSource(preset.source);
    setReceivedAt(preset.received_at || "");
  }

  async function handleIngest(e) {
    e?.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    try {
      const body = { text: text.trim(), source };
      if (receivedAt.trim()) body.received_at = new Date(receivedAt).toISOString();
      const result = await api.ingest(body);
      setLastResult(result);
      await refreshTasks();
      if (result.results?.[0]?.task_id) {
        setSelectedId(result.results[0].task_id);
      }
    } catch (err) {
      setError(err.message);
      setLastResult(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleSelectTask(id) {
    setSelectedId(id);
    setBusy(true);
    try {
      setHistory(await api.history(id));
    } catch (err) {
      setError(err.message);
      setHistory(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!confirm("Clear all messages, tasks, and versions?")) return;
    setBusy(true);
    try {
      await api.reset();
      setLastResult(null);
      setHistory(null);
      setSelectedId(null);
      setText("");
      await refreshTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const offline = apiStatus.startsWith("offline") || apiStatus === "checking";

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="brand">Deadline Agent</p>
          <h1>Forward a message. Inspect what landed in the DB.</h1>
        </div>
        <div className="top-actions">
          <span className={`pill ${offline ? "bad" : "ok"}`}>
            {API_URL} · {apiStatus}
          </span>
          <button type="button" className="ghost" onClick={refreshHealth} disabled={busy}>
            Ping API
          </button>
          <button type="button" className="danger" onClick={handleReset} disabled={busy || offline}>
            Reset DB
          </button>
        </div>
      </header>

      <div className="layout">
        <section className="panel ingest">
          <h2>Forward message</h2>
          <p className="hint">Paste WhatsApp / email / class text. Use presets for the demo cases.</p>

          <div className="presets">
            {DEMO_PRESETS.map((p) => (
              <button key={p.id} type="button" className="chip" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleIngest} className="form">
            <label>
              Message
              <textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='e.g. "DBMS report due 25th not 28th"'
                required
              />
            </label>

            <div className="row">
              <label>
                Source
                <select value={source} onChange={(e) => setSource(e.target.value)}>
                  <option value="whatsapp">whatsapp</option>
                  <option value="email">email</option>
                  <option value="class">class</option>
                  <option value="syllabus">syllabus</option>
                </select>
              </label>
              <label>
                Received at (ISO, optional)
                <input
                  type="datetime-local"
                  value={toLocalInput(receivedAt)}
                  onChange={(e) => setReceivedAt(fromLocalInput(e.target.value))}
                />
              </label>
            </div>

            <button type="submit" className="primary" disabled={busy || offline || !text.trim()}>
              {busy ? "Working…" : "Ingest message"}
            </button>
          </form>

          {error && <p className="error">{error}</p>}

          {lastResult && (
            <div className="result">
              <h3>
                Last result · <span className="tag">{lastResult.classification}</span>
              </h3>
              <ul className="result-list">
                {(lastResult.results || []).map((r, i) => (
                  <li key={i}>
                    <strong>{r.action || r.classification}</strong>
                    {r.task_id && (
                      <>
                        {" "}
                        · task{" "}
                        <button type="button" className="linkish" onClick={() => handleSelectTask(r.task_id)}>
                          {r.task_id.slice(-6)}
                        </button>
                      </>
                    )}
                    {r.kept_due_date && (
                      <span>
                        {" "}
                        · kept {r.kept_due_date} vs reported {r.reported_due_date}
                      </span>
                    )}
                    {r.extraction?.reasoning && <p className="reason">{r.extraction.reasoning}</p>}
                    {r.extraction?.date_resolution_note && (
                      <p className="note">{r.extraction.date_resolution_note}</p>
                    )}
                  </li>
                ))}
              </ul>
              <details>
                <summary>Raw JSON</summary>
                <pre>{JSON.stringify(lastResult, null, 2)}</pre>
              </details>
            </div>
          )}
        </section>

        <section className="panel tasks">
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={tab === t.id ? "active" : ""}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
            <button type="button" className="ghost slim" onClick={refreshTasks} disabled={busy}>
              Refresh
            </button>
          </div>

          <div className="task-list">
            {tasks.length === 0 && <p className="empty">No tasks in this view.</p>}
            {tasks.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`task ${selectedId === t.id ? "selected" : ""}`}
                onClick={() => handleSelectTask(t.id)}
              >
                <div className="task-top">
                  <span className={`status ${t.status}`}>{t.status}</span>
                  <span className="due">{t.due_date || "no date"}</span>
                </div>
                <strong>
                  [{t.course || "?"}] {t.title}
                </strong>
                <span className="meta">
                  {t.task_type}
                  {t.weightage != null ? ` · ${t.weightage}%` : ""}
                </span>
                {t.claimed_due_dates?.length > 1 && (
                  <span className="claims">claimed: {t.claimed_due_dates.join(" vs ")}</span>
                )}
              </button>
            ))}
          </div>

          {history && (
            <div className="history">
              <h3>History · {history.task?.title}</h3>
              <ol>
                {(history.versions || []).map((v) => (
                  <li key={v.id}>
                    <code>{v.reason}</code> · {v.due_date || "null"}
                    {v.date_resolution_note && <p className="note">{v.date_resolution_note}</p>}
                    {v.source_excerpt && <p className="excerpt">“{v.source_excerpt}”</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local) {
  if (!local) return "";
  return new Date(local).toISOString();
}

export default App;
