import './Loader.css';

interface LoaderProps {
  visible: boolean;
}

function MiraLogoMark() {
  return (
    <svg
      viewBox="0 0 56 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="loader-icon-svg"
    >
      {/* Flowing M-wave — financial chart abstracted into MIRA's M */}
      <path
        d="M4 40 C4 40 9 10 17 13 C21.5 14.5 21.5 30 28 30 C34.5 30 34.5 14.5 39 13 C47 10 52 40 52 40"
        stroke="white"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left peak node */}
      <circle cx="17" cy="13" r="3.8" fill="white" />
      {/* Right peak node */}
      <circle cx="39" cy="13" r="3.8" fill="white" />
      {/* Center valley node — smaller, slightly transparent */}
      <circle cx="28" cy="30" r="2.6" fill="white" fillOpacity="0.6" />
      {/* Bottom left anchor */}
      <circle cx="4" cy="40" r="2.2" fill="white" fillOpacity="0.4" />
      {/* Bottom right anchor */}
      <circle cx="52" cy="40" r="2.2" fill="white" fillOpacity="0.4" />
    </svg>
  );
}

export function Loader({ visible }: LoaderProps) {
  return (
    <div id="loader" className={!visible ? 'hidden' : ''}>
      <div className="loader-icon">
        <MiraLogoMark />
      </div>
      <div className="loader-logo">MIRA</div>
      <div className="loader-slogan">Money Intelligence Record Assistant</div>
      <div className="loader-hashtag">#SemuaMudah</div>
      <div className="loader-bar-track">
        <div className="loader-bar" />
      </div>
    </div>
  );
}
