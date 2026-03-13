import { Question } from '../assessmentData';
import './Questions.css';

interface RadioQuestionProps {
  question: Question;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function RadioQuestion({ question, value, onChange }: RadioQuestionProps) {
  return (
    <div className="opts">
      {question.opts?.map((opt) => (
        <div
          key={opt.v}
          className={`opt ${value === opt.v ? 'selected' : ''}`}
          onClick={() => onChange(opt.v)}
        >
          <span className="opt-check"></span>
          <span className="opt-text">{opt.l}</span>
        </div>
      ))}
    </div>
  );
}
