import { useState } from 'react';
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