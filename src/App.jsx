import { useCallback, useEffect, useMemo, useState } from "react";
import { api, API_URL } from "./api";
import { DEMO_PRESETS } from "./presets";
import { FRONTEND_TEST_CORPUS, FRONTEND_TEST_CORPUS_TEXT, CORPUS_STATS } from "./testCorpus";
import { splitMessages, MAX_BATCH } from "./splitMessages";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const [progress, setProgress] = useState(null);
  const [tab, setTab] = useState("all");
  const [tasks, setTasks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState(null);

  const messages = useMemo(() => splitMessages(text), [text]);
  const messageCount = messages.length;

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
  }

  function loadTestCorpus() {
    setText(FRONTEND_TEST_CORPUS_TEXT);
    setSource("whatsapp");
    setLastResult(null);
    setBatchResult(null);
    setError("");
  }

  async function handleIngest(e) {
    e?.preventDefault();
    if (!text.trim()) return;

    if (messageCount > MAX_BATCH) {
      setError(`Too many messages (${messageCount}). Max is ${MAX_BATCH} per run.`);
      return;
    }

    setBusy(true);
    setError("");
    setLastResult(null);
    setBatchResult(null);

    try {
      if (messageCount <= 1) {
        const result = await api.ingest({ text: messages[0] || text.trim(), source });
        setLastResult(result);
        await refreshTasks();
        const firstTask = result.items?.find((i) => i.task_id);
        if (firstTask) setSelectedId(firstTask.task_id);
        return;
      }

      // One server-side fast batch: local extract + Gemini chunks (not 1 call per msg)
      setProgress({ current: 0, total: messages.length, preview: "Starting fast batch…" });
      const batch = await api.ingestBatch({ messages, source });
      setProgress({
        current: batch.processed || messages.length,
        total: messages.length,
        preview: batch.summary || "Done",
      });
      setBatchResult(batch);
      await refreshTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
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
      setBatchResult(null);
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
  const ingestLabel =
    busy && progress
      ? `Ingesting ${progress.current}/${progress.total}…`
      : busy
        ? "Working…"
        : messageCount > 1
          ? `Ingest ${messageCount} messages`
          : "Ingest message";

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
          <h2>Forward message(s)</h2>
          <p className="hint">
            Paste one message, or many — one per line (50–70 is fine, target under 4 minutes).
            Blank line between multi-line messages. Relative dates use today.
          </p>

          <div className="presets">
            {DEMO_PRESETS.map((p) => (
              <button key={p.id} type="button" className="chip" onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
            <button
              type="button"
              className="chip corpus"
              onClick={loadTestCorpus}
              disabled={busy}
              title="85 ordered messages covering all test cases"
            >
              Load test corpus ({CORPUS_STATS.total})
            </button>
          </div>

          <form onSubmit={handleIngest} className="form">
            <label>
              Message{messageCount > 1 ? "s" : ""}
              <textarea
                rows={messageCount > 3 ? 10 : 5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  "One message:\nScience lab report due Friday\n\nOr many (one per line):\nScience quiz tomorrow\nMaths worksheet due next Friday\nanyone for football?"
                }
                required
              />
            </label>

            {messageCount > 0 && (
              <p className={`batch-count ${messageCount > MAX_BATCH ? "over" : ""}`}>
                {messageCount} message{messageCount === 1 ? "" : "s"} detected
                {messageCount > MAX_BATCH ? ` (max ${MAX_BATCH})` : ""}
                {messageCount > 5
                  ? " · target: finish within ~4 minutes"
                  : ""}
              </p>
            )}

            <label>
              Source
              <select value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="whatsapp">whatsapp</option>
                <option value="email">email</option>
                <option value="class">class</option>
                <option value="syllabus">syllabus</option>
              </select>
            </label>

            <button
              type="submit"
              className="primary"
              disabled={busy || offline || !text.trim() || messageCount > MAX_BATCH}
            >
              {ingestLabel}
            </button>
          </form>

          {progress && (
            <div className="progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="progress-text">
                {progress.current}/{progress.total}: {progress.preview}
              </p>
            </div>
          )}

          {error && <p className="error">{error}</p>}

          {lastResult && !batchResult && (
            <div className="result">
              <div className="result-header">
                <h3>{lastResult.outcome_label}</h3>
                <p className="result-summary">{lastResult.summary}</p>
              </div>
              {(lastResult.items || []).map((item, i) => (
                <ResultCard key={i} item={item} onView={handleSelectTask} />
              ))}
            </div>
          )}

          {batchResult && (
            <div className="result">
              <div className="result-header">
                <h3>
                  Batch complete
                  {batchResult.elapsed_s != null ? ` · ${batchResult.elapsed_s}s` : ""}
                  {batchResult.within_sla === false ? " (over SLA)" : ""}
                </h3>
                <p className="result-summary">{batchResult.summary}</p>
              </div>
              <div className="batch-list">
                {batchResult.results.map((r) => (
                  <div key={r.index} className={`batch-row ${r.ok ? "" : "fail"}`}>
                    <span className="batch-idx">#{r.index}</span>
                    <div className="batch-body">
                      <p className="batch-preview">{r.preview}</p>
                      {r.ok ? (
                        <p className="batch-outcome">
                          {r.outcome_label}
                          {r.items?.[0]?.summary ? ` — ${r.items[0].summary}` : ""}
                        </p>
                      ) : (
                        <p className="batch-outcome fail-text">{r.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

function ResultCard({ item, onView }) {
  return (
    <div className="result-card">
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
      {item.conflict && <p className="result-conflict">{item.conflict.message}</p>}
      {item.task_id && (
        <button type="button" className="linkish" onClick={() => onView(item.task_id)}>
          View in task list →
        </button>
      )}
    </div>
  );
}

export default App;
