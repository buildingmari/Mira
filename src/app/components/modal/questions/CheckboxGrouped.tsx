import { Question } from '../assessmentData';
import './Questions.css';

interface CheckboxGroupedProps {
  question: Question;
  value: string[];
  onChange: (value: string[]) => void;
}

export function CheckboxGrouped({ question, value, onChange }: CheckboxGroupedProps) {
  const handleToggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div>
      {question.groups?.map((group, gi) => (
        <div key={gi} className="cbg-group">
          <div className="cbg-group-label">{group.label}</div>
          <div className="cbg-opts">
            {group.opts.map((opt) => (
              <div
                key={opt.v}
                className={`cbg-opt ${value.includes(opt.v) ? 'selected' : ''}`}
                onClick={() => handleToggle(opt.v)}
              >
                <span className="cbg-check"></span>
                {opt.l}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
