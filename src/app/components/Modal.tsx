import { useState, useEffect, useRef } from 'react';
import { AssessmentPanel } from './modal/AssessmentPanel';
import { OutcomesPanel } from './modal/OutcomesPanel';
import { PricingPanel } from './modal/PricingPanel';
import { WAPanel } from './modal/WAPanel';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PanelType = 'assessment' | 'outcomes' | 'pricing' | 'wa';

export function Modal({ isOpen, onClose }: ModalProps) {
  const [currentPanel, setCurrentPanel] = useState<PanelType>('assessment');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedPlan, setSelectedPlan] = useState('personal');
  const [selectedDuration, setSelectedDuration] = useState('12');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [activeVoucher, setActiveVoucher] = useState('');
  const [affiliateReferrerPhone, setAffiliateReferrerPhone] = useState('');
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Scroll modal body to top setiap ganti panel
  useEffect(() => {
    modalBodyRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPanel]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset state when modal opens
      setCurrentPanel('assessment');
      setAnswers({});
      setVoucherDiscount(0);
      setActiveVoucher('');
      setAffiliateReferrerPhone('');
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleBgClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getModalTitle = () => {
    switch (currentPanel) {
      case 'assessment':
        return 'Cek Kesehatan Finansialmu';
      case 'outcomes':
        return '📊 Hasil Kesehatan Finansialmu';
      case 'pricing':
        return '🔥 Pilih Paket MIRA';
      case 'wa':
        return '📱 Nomor WhatsApp';
      default:
        return 'MIRA';
    }
  };

  return (
    <div
      className={`modal-overlay ${isOpen ? 'open' : ''}`}
      onClick={handleBgClick}
    >
      <div className="modal-box" id="modalBox">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="modal-header">
          <div className="modal-title">{getModalTitle()}</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body" ref={modalBodyRef}>
          {currentPanel === 'assessment' && (
            <AssessmentPanel
              answers={answers}
              setAnswers={setAnswers}
              onComplete={() => {
                // Simpan data asesmen ke localStorage untuk dipakai di dashboard/settings
                try { localStorage.setItem('mira_assessment', JSON.stringify(answers)); } catch {}
                setCurrentPanel('outcomes');
              }}
            />
          )}
          {currentPanel === 'outcomes' && (
            <OutcomesPanel
              answers={answers}
              onNext={() => setCurrentPanel('pricing')}
            />
          )}
          {currentPanel === 'pricing' && (
            <PricingPanel
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              selectedDuration={selectedDuration}
              setSelectedDuration={setSelectedDuration}
              voucherDiscount={voucherDiscount}
              setVoucherDiscount={setVoucherDiscount}
              activeVoucher={activeVoucher}
              setActiveVoucher={setActiveVoucher}
              setAffiliateReferrerPhone={setAffiliateReferrerPhone}
              onNext={() => setCurrentPanel('wa')}
              onBack={() => setCurrentPanel('outcomes')}
            />
          )}
          {currentPanel === 'wa' && (
            <WAPanel
              selectedPlan={selectedPlan}
              selectedDuration={selectedDuration}
              voucherDiscount={voucherDiscount}
              activeVoucher={activeVoucher}
              affiliateReferrerPhone={affiliateReferrerPhone}
              answers={answers}
              onBack={() => setCurrentPanel('pricing')}
            />
          )}
        </div>
      </div>
    </div>
  );
}