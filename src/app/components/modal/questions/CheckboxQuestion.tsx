import { Question } from '../assessmentData';
import { OptionIcon } from '../../icons/MiraIcon';
import './Questions.css';

interface CheckboxQuestionProps {
  question: Question;
  value: string[];
  onChange: (value: string[]) => void;
}

export function CheckboxQuestion({ question, value, onChange }: CheckboxQuestionProps) {
  const handleToggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="opts">
      {question.opts?.map((opt) => (
        <div
          key={opt.v}
          className={`opt ${value.includes(opt.v) ? 'selected' : ''}`}
          onClick={() => handleToggle(opt.v)}
        >
          <OptionIcon icon={opt.icon} brand={opt.brand} />
          <span className="opt-text">{opt.l}</span>
          <span className="opt-cb-check"></span>
        </div>
      ))}
    </div>
  );
}
