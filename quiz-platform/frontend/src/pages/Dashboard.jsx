import { useState } from 'react';
import AddQuestionForm from '../components/AddQuestionForm.jsx';
import Leaderboard from '../components/Leaderboard.jsx';
import QuestionCard from '../components/QuestionCard.jsx';

export default function Dashboard({
  user,
  questions,
  leaderboard,
  onRefreshQuestions,
  onRefreshLeaderboard,
  onSubmitAnswer,
  onAddQuestion
}) {
  const [selectedAnswers, setSelectedAnswers] = useState({});

  function selectAnswer(questionId, answer) {
    setSelectedAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  return (
    <div className="dashboard-grid">
      <section className="content-column">
        <div className="section-header">
          <div>
            <p className="eyebrow">Questions</p>
            <h2>Answer the quiz</h2>
          </div>
          <button className="ghost-button" onClick={onRefreshQuestions}>Get Questions</button>
        </div>

        <div className="question-list">
          {questions.length ? questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              isAdmin={user.role === 'admin'}
              selectedAnswer={selectedAnswers[question.id]}
              onSelect={(answer) => selectAnswer(question.id, answer)}
              onSubmit={() => onSubmitAnswer(question.id, selectedAnswers[question.id])}
            />
          )) : <div className="empty-state">No questions loaded yet. Click Get Questions.</div>}
        </div>
      </section>

      <aside className="side-column">
        {user.role === 'admin' ? <AddQuestionForm onAddQuestion={onAddQuestion} /> : null}

        <div className="panel-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Scores</p>
              <h2>Leaderboard</h2>
            </div>
            <button className="ghost-button" onClick={onRefreshLeaderboard}>Refresh</button>
          </div>
          <Leaderboard leaderboard={leaderboard} />
        </div>
      </aside>
    </div>
  );
}
