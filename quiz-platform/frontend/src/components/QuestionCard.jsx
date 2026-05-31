const optionKeys = ['A', 'B', 'C', 'D'];

export default function QuestionCard({ question, isAdmin, selectedAnswer, onSelect, onSubmit }) {
  return (
    <article className="question-card">
      <div className="question-topline">
        <span>Question #{question.id}</span>
        <strong>{question.points} pts</strong>
      </div>

      <h3>{question.questionText}</h3>

      <div className="options-grid">
        {optionKeys.map((key) => (
          <button
            key={key}
            className={selectedAnswer === key ? 'option-button selected' : 'option-button'}
            onClick={() => onSelect(key)}
          >
            <span>{key}</span>
            {question[`option${key}`]}
          </button>
        ))}
      </div>

      <div className="question-footer">
        {isAdmin && question.correctAnswer ? <span className="answer-pill">Correct: {question.correctAnswer}</span> : <span />}
        <button className="primary-button small" disabled={!selectedAnswer} onClick={onSubmit}>Submit Answer</button>
      </div>
    </article>
  );
}
