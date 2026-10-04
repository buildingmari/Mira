import { useState, useEffect, useRef } from 'react';
import { AssessmentPanel } from './modal/AssessmentPanel';
import { OutcomesPanel } from './modal/OutcomesPanel';
import { PricingPanel } from './modal/PricingPanel';
import { WAPanel } from './modal/WAPanel';
import { AccountPanel } from './modal/AccountPanel';
import { MiraIcon, type IconName } from './icons/MiraIcon';
import { WHATSAPP_AUTH_ENABLED, getSignupDraft } from '../lib/auth';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Reopen at the account step with the signup saved before a Google /
   *  email-confirmation redirect (see lib/auth.ts signup draft). */
  resume?: boolean;
}

type PanelType = 'assessment' | 'outcomes' | 'pricing' | 'account' | 'wa';

// Last step: create the login (Google / email) — or, when re-enabled, the
// old WhatsApp-number signup.
const FINAL_PANEL: PanelType = WHATSAPP_AUTH_ENABLED ? 'wa' : 'account';

export function Modal({ isOpen, onClose, resume = false }: ModalProps) {
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
      const saved = resume ? getSignupDraft() : null;
      if (saved) {
        setAnswers(saved.answers);
        setSelectedPlan(saved.selectedPlan);
        setSelectedDuration(saved.selectedDuration);
        setVoucherDiscount(saved.voucherDiscount);
        setActiveVoucher(saved.activeVoucher);
        setAffiliateReferrerPhone(saved.affiliateReferrerPhone);
        setCurrentPanel(FINAL_PANEL);
        return;
      }
      // Reset state when modal opens
      setCurrentPanel('assessment');
      setAnswers({});
      setVoucherDiscount(0);
      setActiveVoucher('');
      setAffiliateReferrerPhone('');
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, resume]);

  const handleBgClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const TITLES: Record<PanelType, [IconName | null, string]> = {
    assessment: [null, 'Cek Kesehatan Finansialmu'],
    outcomes: ['report', 'Hasil Kesehatan Finansialmu'],
    pricing: ['gem', 'Pilih Paket MIRA'],
    account: [null, 'Langkah Terakhir'],
    wa: ['phone-wallet', 'Nomor WhatsApp'],
  };
  const [titleIcon, titleText] = TITLES[currentPanel];

  return (
    <div
      className={`modal-overlay ${isOpen ? 'open' : ''}`}
      onClick={handleBgClick}
    >
      <div className="modal-box" id="modalBox">
        <div className="sheet-handle" aria-hidden="true" />
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {titleIcon && <MiraIcon name={titleIcon} size={28} />}
            {titleText}
          </div>
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
              onNext={() => setCurrentPanel(FINAL_PANEL)}
              onBack={() => setCurrentPanel('outcomes')}
            />
          )}
          {currentPanel === 'account' && (
            <AccountPanel
              selectedPlan={selectedPlan}
              selectedDuration={selectedDuration}
              voucherDiscount={voucherDiscount}
              activeVoucher={activeVoucher}
              affiliateReferrerPhone={affiliateReferrerPhone}
              answers={answers}
              onBack={() => setCurrentPanel('pricing')}
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