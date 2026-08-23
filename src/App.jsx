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
      const firstTask = result.items?.find((i) => i.task_id);
      if (firstTask) setSelectedId(firstTask.task_id);
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
    if (!confirm("Clear all messages, tasks, and courses?")) return;
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
          <h1>Forward a message. See subject and deadline clearly.</h1>
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
          <p className="hint">Paste WhatsApp / email / class text. We extract subject, task, and due date.</p>

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
                placeholder='e.g. "Science lab report due Friday, 20%"'
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
                Received at (optional)
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
              <div className="result-header">
                <h3>{lastResult.outcome_label}</h3>
                <p className="result-summary">{lastResult.summary}</p>
              </div>

              {(lastResult.items || []).map((item, i) => (
                <div key={i} className="result-card">
                  <p className="result-action">{item.action_label}</p>
                  {item.subject || item.task ? (
                    <div className="result-grid">
                      <div>
                        <span className="label">Subject</span>
                        <strong>{item.subject || "—"}</strong>
                      </div>
                      <div>
                        <span className="label">Task</span>
                        <strong>{item.task || "—"}</strong>
                      </div>
                      <div>
                        <span className="label">Due</span>
                        <strong>{item.due_display || "Date unknown"}</strong>
                      </div>
                      <div>
                        <span className="label">Status</span>
                        <strong>{item.status_label || "—"}</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="result-empty">{item.summary}</p>
                  )}
                  {item.weightage_display && (
                    <p className="result-meta">Weightage: {item.weightage_display}</p>
                  )}
                  {item.conflict && (
                    <p className="result-conflict">{item.conflict.message}</p>
                  )}
                  {item.task_id && (
                    <button type="button" className="linkish" onClick={() => handleSelectTask(item.task_id)}>
                      View in task list →
                    </button>
                  )}
                </div>
              ))}
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
                <div className="task-row">
                  <span className="label">Subject</span>
                  <span className={`course-badge ${t.subject ? "" : "missing"}`}>
                    {t.subject || "General"}
                  </span>
                </div>
                <div className="task-row main">
                  <span className="label">Task</span>
                  <strong className="task-name">{t.task}</strong>
                </div>
                <div className="task-details">
                  <div>
                    <span className="label">Due</span>
                    <span className="due">{t.due_display}</span>
                  </div>
                  <div>
                    <span className="label">Status</span>
                    <span className={`status ${t.status}`}>{t.status_label}</span>
                  </div>
                  {t.weightage_display && (
                    <div>
                      <span className="label">Weight</span>
                      <span className="meta">{t.weightage_display}</span>
                    </div>
                  )}
                </div>
                {t.conflict_display && (
                  <p className="claims">Conflicting dates: {t.conflict_display}</p>
                )}
              </button>
            ))}
          </div>

          {history && (
            <div className="history">
              <div className="history-header">
                <span className="label">Subject</span>
                <span className="course-badge small">{history.task?.subject || "General"}</span>
              </div>
              <h3 className="history-title">{history.task?.task}</h3>
              <p className="history-sub">
                Due {history.task?.due_display} · {history.task?.status_label}
              </p>
              <ol className="history-list">
                {(history.versions || []).map((v) => (
                  <li key={v.id}>
                    <strong>{v.reason_label}</strong> — {v.due_display}
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
