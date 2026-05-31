import { useState } from 'react';

const initialForm = {
  questionText: 'What does CLI stand for?',
  optionA: 'Command Line Interface',
  optionB: 'Code Link Input',
  optionC: 'Central Logic Index',
  optionD: 'Command Logic Internet',
  correctAnswer: 'A',
  points: 10
};

export default function AddQuestionForm({ onAddQuestion }) {
  const [form, setForm] = useState(initialForm);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    const success = await onAddQuestion({ ...form, points: Number(form.points) });

    if (success) {
      setForm(initialForm);
    }
  }

  return (
    <div className="panel-card admin-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Add question</h2>
        </div>
      </div>

      <form className="stacked-form" onSubmit={submit}>
        <label>
          Question text
          <textarea name="questionText" value={form.questionText} onChange={updateField} placeholder="Write the question" />
        </label>

        <div className="two-field-grid">
          <label>
            Option A
            <input name="optionA" value={form.optionA} onChange={updateField} />
          </label>
          <label>
            Option B
            <input name="optionB" value={form.optionB} onChange={updateField} />
          </label>
          <label>
            Option C
            <input name="optionC" value={form.optionC} onChange={updateField} />
          </label>
          <label>
            Option D
            <input name="optionD" value={form.optionD} onChange={updateField} />
          </label>
        </div>

        <div className="two-field-grid">
          <label>
            Correct answer
            <select name="correctAnswer" value={form.correctAnswer} onChange={updateField}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </label>
          <label>
            Points
            <input name="points" type="number" min="1" value={form.points} onChange={updateField} />
          </label>
        </div>

        <button className="primary-button" type="submit">Add Question</button>
      </form>
    </div>
  );
}
