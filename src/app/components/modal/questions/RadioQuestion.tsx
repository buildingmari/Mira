import { Question } from '../assessmentData';
import { OptionIcon } from '../../icons/MiraIcon';
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
          <OptionIcon icon={opt.icon} brand={opt.brand} />
          <span className="opt-text">{opt.l}</span>
          <span className="opt-check"></span>
        </div>
      ))}
    </div>
  );
}
