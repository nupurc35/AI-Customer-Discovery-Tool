import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL


const initialAnswers = [];

export default function App() {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(initialAnswers);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchQuestions = async (event) => {
    event.preventDefault();
    if (!description.trim()) {
      setError('Add a business description first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate questions.');
      }

      setQuestions(data.questions);
      setAnswers(data.questions.map((question) => ({ question, answer: '' })));
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (index, value) => {
    setAnswers((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index ? { ...item, answer: value } : item
      )
    );
  };

  const fetchReport = async (event) => {
    event.preventDefault();
    if (answers.some((item) => !item.answer.trim())) {
      setError('Answer all AI questions before generating the report.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, answers }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate report.');
      }

      setReport(data);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setDescription('');
    setQuestions([]);
    setAnswers(initialAnswers);
    setReport(null);
    setError('');
  };

  return (
    <div className="app-shell">
      <div className="scanlines" />
      <main className="app-frame">
        <header className="hero">
          <p className="eyebrow">AI Market Intel Console</p>
          <h1>Customer Discovery Tool</h1>
          <p className="hero-copy">
            Turn a rough business concept into interview questions, signal-rich answers,
            and an actionable market report.
          </p>
        </header>

        <section className="step-indicator" aria-label="Progress">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`step-pill ${step >= item ? 'active' : ''}`}
            >
              <span>{`0${item}`}</span>
              <strong>
                {item === 1 ? 'Describe' : item === 2 ? 'Answer' : 'Report'}
              </strong>
            </div>
          ))}
        </section>

        {error ? <div className="error-banner">{error}</div> : null}

        {step === 1 ? (
          <section className="panel">
            <div className="panel-header">
              <h2>Step 1: Describe the business</h2>
              <p>Give the AI enough context to frame meaningful discovery questions.</p>
            </div>
            <form onSubmit={fetchQuestions} className="stack">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Example: We want to build an AI assistant for independent fitness coaches to automate client check-ins, progress summaries, and upsell timing."
                rows={8}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Generate AI Questions'}
              </button>
            </form>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="panel">
            <div className="panel-header">
              <h2>Step 2: Answer the AI questions</h2>
              <p>Respond as if you had just interviewed potential customers.</p>
            </div>
            <form onSubmit={fetchReport} className="stack">
              {questions.map((question, index) => (
                <label key={question} className="question-card">
                  <span>{question}</span>
                  <textarea
                    value={answers[index]?.answer || ''}
                    onChange={(event) => updateAnswer(index, event.target.value)}
                    rows={4}
                    placeholder="Add your customer insight here..."
                  />
                </label>
              ))}
              <div className="button-row">
                <button type="button" className="ghost-button" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Analyzing...' : 'Generate Report'}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {step === 3 && report ? (
          <section className="panel report-panel">
            <div className="panel-header">
              <h2>Step 3: Discovery report</h2>
              <p>Use this output to refine positioning, prioritization, and your next interviews.</p>
            </div>

            <div className="report-grid">
              <article className="report-card">
                <h3>Target Segments</h3>
                <ul>
                  {report.target_segments?.map((segment) => (
                    <li key={segment}>{segment}</li>
                  ))}
                </ul>
              </article>

              <article className="report-card">
                <h3>Pain Points</h3>
                <ul>
                  {report.pain_points?.map((item, index) => (
                    <li key={`${item.point}-${index}`}>
                      <strong>{item.point}</strong>
                      <span>{item.severity}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="report-card">
                <h3>Solution Ideas</h3>
                <ul>
                  {report.solution_ideas?.map((item, index) => (
                    <li key={`${item.idea}-${index}`}>
                      <strong>{item.idea}</strong>
                      <p>{item.ai_angle}</p>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="report-card">
                <h3>Quick Wins</h3>
                <ul>
                  {report.quick_wins?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>

            <article className="summary-card">
              <h3>Summary</h3>
              <p>{report.summary}</p>
            </article>

            <div className="button-row">
              <button type="button" className="ghost-button" onClick={() => setStep(2)}>
                Back
              </button>
              <button type="button" onClick={resetFlow}>
                Start New Discovery Run
              </button>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
