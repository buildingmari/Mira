import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { isStandalone } from '../lib/pwa';
import { Navigation } from '../components/Navigation';
import { Hero } from '../components/Hero';
import { ValueProps } from '../components/ValueProps';
import { FeatureShowcase } from '../components/FeatureShowcase';
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
  const [resumeSignup, setResumeSignup] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  // Logged in already (session lives in localStorage until logout).
  const loggedIn = (() => { try { return !!localStorage.getItem('mira_phone'); } catch { return false; } })();

  // The installed app should open on the dashboard, not the marketing page.
  useEffect(() => {
    if (loggedIn && isStandalone() && !searchParams.get('signup')) navigate('/dashboard', { replace: true });
  }, []);

  const openLogin = () => (loggedIn ? navigate('/dashboard') : setLoginOpen(true));

  // Deep links (used by /auth/callback): /?signup=1 opens the signup
  // (assessment) flow, /?signup=resume reopens it at the account step after
  // a Google / email-confirmation redirect, /?login=1 opens the login modal.
  // The param is stripped right away (replace) so a refresh or the back
  // button doesn't reopen the modal.
  useEffect(() => {
    const signup = searchParams.get('signup');
    const wantsLogin = searchParams.get('login') === '1';
    if (!signup && !wantsLogin) return;

    if (signup) { setResumeSignup(signup === 'resume'); setModalOpen(true); }
    else if (loggedIn) { navigate('/dashboard', { replace: true }); return; }
    else setLoginOpen(true);

    const next = new URLSearchParams(searchParams);
    next.delete('signup');
    next.delete('login');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const openSignup = () => { setResumeSignup(false); setModalOpen(true); };

  return (
    <>
      <div id="page" className="visible">
        <Navigation
          onCTAClick={openSignup}
          onLoginClick={openLogin}
          loginLabel={loggedIn ? 'Dashboard' : 'Masuk'}
        />
        <Hero onCTAClick={openSignup} />
        <ValueProps />
        <FeatureShowcase onCTAClick={openSignup} />
        <Process />
        <DashboardPreview onCTAClick={openSignup} />
        <Stats onCTAClick={openSignup} />
        <Testimonials />
        <Compare />
        <FAQ />
        <Upsell onCTAClick={openSignup} />
        <Footer />
      </div>

      <Modal isOpen={modalOpen} resume={resumeSignup} onClose={() => setModalOpen(false)} />
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSignup={() => { setLoginOpen(false); openSignup(); }}
      />
    </>
  );
}