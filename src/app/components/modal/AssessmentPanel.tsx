import { useState, useRef, useCallback } from 'react';
import { steps, allQuestions, totalQuestions } from './assessmentData';
import { RadioQuestion } from './questions/RadioQuestion';
import { CheckboxQuestion } from './questions/CheckboxQuestion';
import { RatioSlider } from './questions/RatioSlider';
import { CheckboxGrouped } from './questions/CheckboxGrouped';
import { RankingQuestion } from './questions/RankingQuestion';
import './AssessmentPanel.css';

interface AssessmentPanelProps {
  answers: Record<string, any>;
  setAnswers: (answers: Record<string, any>) => void;
  onComplete: () => void;
}

export function AssessmentPanel({ answers, setAnswers, onComplete }: AssessmentPanelProps) {
  const [nameStep, setNameStep]   = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [shake, setShake] = useState(false);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentQ = allQuestions[currentStep];
  const stepInfo = currentQ.stepInfo;
  const stepIndex = steps.findIndex((s) => s === stepInfo);

  const scrollToTop = () => {
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTop = 0;
  };

  // ── Submit name step ──────────────────────────────────────────────
  const handleNameSubmit = () => {
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setNameError(true);
      setTimeout(() => setNameError(false), 600);
      return;
    }
    setAnswers({ ...answers, user_name: nameInput.trim() });
    setNameStep(false);
    scrollToTop();
  };

  const advanceStep = useCallback((currentAnswers: Record<string, any>) => {
    let nextStep = currentStep + 1;

    if (nextStep < totalQuestions && allQuestions[nextStep].id === 'q14' && currentAnswers['q13'] === 'tidak') {
      nextStep += 1;
    }

    if (nextStep < totalQuestions) {
      setCurrentStep(nextStep);
      scrollToTop();
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handleAnswer = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentQ.type === 'radio' && !autoAdvancing) {
      setAutoAdvancing(true);
      setTimeout(() => {
        setAutoAdvancing(false);
        advanceStep(newAnswers);
      }, 320);
    }
  };

  const validateAnswer = () => {
    const answer = answers[currentQ.id];
    const skipValidation = currentQ.type === 'ratio_slider' || currentQ.type === 'ranking' || currentQ.type === 'radio';
    if (skipValidation) return true;
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return false;
    return true;
  };

  const handleNext = () => {
    if (!validateAnswer()) {
      setShake(true);
      setTimeout(() => setShake(false), 350);
      return;
    }

    if (currentQ.type === 'ratio_slider' && !answers[currentQ.id]) {
      setAnswers({ ...answers, [currentQ.id]: 60 });
    }

    advanceStep({ ...answers });
  };

  const handlePrev = () => {
    if (currentStep === 0) {
      // Kembali ke name step
      setNameStep(true);
      return;
    }
    let prevStep = currentStep - 1;
    if (prevStep >= 0 && allQuestions[prevStep].id === 'q14' && answers['q13'] === 'tidak') {
      prevStep -= 1;
    }
    setCurrentStep(Math.max(0, prevStep));
    scrollToTop();
  };

  const isRadio = currentQ.type === 'radio';
  const userName = answers.user_name || '';

  // ── Name step UI ──────────────────────────────────────────────────
  if (nameStep) {
    return (
      <div id="assessment-panel" ref={scrollRef}>
        {/* Avatar MIRA — logo M sama persis dengan loading screen */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2D4BFF 0%, #22D3EE 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 8px 24px rgba(45,75,255,0.25)',
            position: 'relative',
          }}>
            <svg viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{ width: '38px', height: '38px' }}>
              <path
                d="M4 40 C4 40 9 10 17 13 C21.5 14.5 21.5 30 28 30 C34.5 30 34.5 14.5 39 13 C47 10 52 40 52 40"
                stroke="white" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round"
              />
              <circle cx="17" cy="13" r="3.8" fill="white" />
              <circle cx="39" cy="13" r="3.8" fill="white" />
              <circle cx="28" cy="30" r="2.6" fill="white" fillOpacity="0.6" />
              <circle cx="4"  cy="40" r="2.2" fill="white" fillOpacity="0.4" />
              <circle cx="52" cy="40" r="2.2" fill="white" fillOpacity="0.4" />
            </svg>
            {/* Online dot */}
            <span style={{
              position: 'absolute', bottom: '4px', right: '4px',
              width: '14px', height: '14px', borderRadius: '50%',
              background: '#22C55E', border: '2px solid white',
            }} />
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', letterSpacing: '0.05em' }}>
            MIRA · Asisten Keuangan
          </p>
        </div>

        {/* Satu chat bubble sederhana */}
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF, #F0FDFA)',
          border: '1px solid #BFDBFE',
          borderRadius: '4px 18px 18px 18px',
          padding: '14px 18px',
          fontSize: '0.95rem',
          color: '#1E293B',
          lineHeight: 1.65,
          marginBottom: '28px',
        }}>
          Hi! Mira mau kenalan dulu, nama kamu siapa? 😊
        </div>

        {/* Input */}
        <input
          type="text"
          placeholder="Nama panggilanmu…"
          value={nameInput}
          onChange={(e) => { setNameInput(e.target.value); setNameError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
          autoFocus
          style={{
            width: '100%',
            padding: '13px 16px',
            border: `1.5px solid ${nameError ? '#EF4444' : '#CBD5E1'}`,
            borderRadius: '12px',
            fontSize: '1rem',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            background: '#FAFBFF',
          }}
        />

        {nameError && (
          <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '6px' }}>
            Tulis nama panggilanmu ya (min. 2 karakter) 😊
          </p>
        )}

        <button
          className="btn btn-full"
          style={{ marginTop: '16px', fontSize: '1rem' }}
          onClick={handleNameSubmit}
        >
          Mulai →
        </button>
      </div>
    );
  }

  // ── Regular questions UI ──────────────────────────────────────────
  return (
    <div id="assessment-panel" ref={scrollRef}>
      {/* Progress bar */}
      <div className="assess-progress">
        {steps.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div
              key={i}
              className={`progress-step ${done ? 'done' : active ? 'active' : ''}`}
            />
          );
        })}
      </div>
      <p className="progress-label">Langkah {stepIndex + 1} dari {steps.length}</p>

      {/* Step content */}
      <div className={`step-content ${shake ? 'shake' : ''} ${autoAdvancing ? 'auto-advancing' : ''}`}>
        <div className="step-header">
          <div className="step-tag">{stepInfo.tag}</div>
          <h3>{stepInfo.title}</h3>
          <p>
            {userName
              ? <>Oke <strong>{userName}</strong>, {stepInfo.desc.charAt(0).toLowerCase() + stepInfo.desc.slice(1)}</>
              : stepInfo.desc}
          </p>
        </div>

        <div className="q-block">
          <div className="q-label">
            <span className="q-num">{currentQ.num}</span> {currentQ.label}
          </div>

          {currentQ.type === 'radio' && (
            <RadioQuestion
              question={currentQ}
              value={answers[currentQ.id]}
              onChange={(v) => handleAnswer(currentQ.id, v)}
            />
          )}
          {currentQ.type === 'checkbox' && (
            <CheckboxQuestion
              question={currentQ}
              value={answers[currentQ.id] || []}
              onChange={(v) => handleAnswer(currentQ.id, v)}
            />
          )}
          {currentQ.type === 'ratio_slider' && (
            <RatioSlider
              value={answers[currentQ.id] || 60}
              onChange={(v) => handleAnswer(currentQ.id, v)}
            />
          )}
          {currentQ.type === 'checkbox_grouped' && (
            <CheckboxGrouped
              question={currentQ}
              value={answers[currentQ.id] || []}
              onChange={(v) => handleAnswer(currentQ.id, v)}
            />
          )}
          {currentQ.type === 'ranking' && (
            <RankingQuestion
              answers={answers}
              value={answers[currentQ.id]}
              onChange={(v) => handleAnswer(currentQ.id, v)}
            />
          )}

          {isRadio && (
            <p className="auto-advance-hint">
              {autoAdvancing ? '✓ Melanjutkan…' : 'Pilih salah satu untuk lanjut otomatis'}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className={`step-nav ${isRadio ? 'nav-radio-mode' : ''}`}>
        <button
          className="btn btn-outline btn-sm"
          onClick={handlePrev}
        >
          ← Kembali
        </button>
        <span className="step-counter">{currentStep + 1} / {totalQuestions}</span>
        {!isRadio && (
          <button className="btn btn-sm" onClick={handleNext}>
            {currentStep === totalQuestions - 1 ? 'Lihat Hasil 🎯' : 'Lanjut →'}
          </button>
        )}
        {isRadio && <span />}
      </div>
    </div>
  );
}