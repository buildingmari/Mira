import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Navigation } from '../components/Navigation';
import { Hero } from '../components/Hero';
import { ValueProps } from '../components/ValueProps';
import { Process } from '../components/Process';
import { DashboardPreview } from '../components/DashboardPreview';
import { Stats } from '../components/Stats';
import { Testimonials } from '../components/Testimonials';
import { Compare } from '../components/Compare';
import { FAQ } from '../components/FAQ';
import { Upsell } from '../components/Upsell';
import { Footer } from '../components/Footer';
import { Modal } from '../components/Modal';
import { LoginModal } from '../components/LoginModal';
import '../../styles/mira-theme.css';
import '../../styles/mira-landing.css';

export function LandingWrapper() {
  const [modalOpen, setModalOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep links: /?signup=1 opens the signup (assessment) flow — used by
  // /auth/callback after a Google sign-in — and /?login=1 opens the login
  // modal. The param is stripped right away (replace) so a refresh or the
  // back button doesn't reopen the modal.
  useEffect(() => {
    const wantsSignup = searchParams.get('signup') === '1';
    const wantsLogin  = searchParams.get('login') === '1';
    if (!wantsSignup && !wantsLogin) return;

    if (wantsSignup) setModalOpen(true);
    else setLoginOpen(true);

    const next = new URLSearchParams(searchParams);
    next.delete('signup');
    next.delete('login');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <>
      <div id="page" className="visible">
        <Navigation
          onCTAClick={() => setModalOpen(true)}
          onLoginClick={() => setLoginOpen(true)}
        />
        <Hero onCTAClick={() => setModalOpen(true)} />
        <ValueProps />
        <Process />
        <DashboardPreview onCTAClick={() => setModalOpen(true)} />
        <Stats onCTAClick={() => setModalOpen(true)} />
        <Testimonials />
        <Compare />
        <FAQ />
        <Upsell onCTAClick={() => setModalOpen(true)} />
        <Footer />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}