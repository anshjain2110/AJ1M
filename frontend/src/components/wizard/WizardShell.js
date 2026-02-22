import React from 'react';
import { ArrowLeft, Phone, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWizard } from '../../context/WizardContext';
import { getCurrentStepNumber } from '../../utils/wizardConfig';

export default function WizardShell({ children, showBack = true, showProgress = true }) {
  const { state, goBack, dispatch } = useWizard();
  const navigate = useNavigate();
  const { currentScreen, answers, frozenStepTotal } = state;
  const currentStep = getCurrentStepNumber(currentScreen, answers);
  const totalSteps = frozenStepTotal || 12;
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const isWizardScreen = currentScreen !== 'landing' && currentScreen !== 'thank_you';
  const isLoggedIn = !!localStorage.getItem('tlj_token');
  const canGoBack = isWizardScreen && currentScreen !== 'product_type';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--lj-bg)' }}>
      <header className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: 'var(--lj-bg)', borderBottom: '1px solid var(--lj-border)' }}>
        <div className="flex items-center gap-3">
          {showBack && canGoBack && (
            <button
              onClick={goBack}
              data-testid="wizard-back-button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[14px] font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
              style={{ color: 'var(--lj-accent)' }}
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
          )}
          <button onClick={() => { dispatch({ type: 'RESET' }); navigate('/'); }} className="cursor-pointer"><img src="/logo-main.png" alt="The Local Jewel" className="h-8 object-contain" /></button>
        </div>
        <div className="flex items-center gap-2">
          <a href="tel:+15857108292" data-testid="landing-click-to-call-button" className="flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors duration-300 hover:bg-[#F0F0EE]" style={{ color: 'var(--lj-accent)' }}>
            <Phone size={16} /><span className="hidden sm:inline">Call Us</span>
          </a>
          <button
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
            data-testid="header-login-button"
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300 hover:bg-[#F0F0EE]"
            style={{ color: 'var(--lj-accent)' }}
          >
            <User size={16} />
            <span className="hidden sm:inline">{isLoggedIn ? 'My Account' : 'Login'}</span>
          </button>
        </div>
      </header>

      {/* Progress bar - shown on all wizard steps */}
      {showProgress && isWizardScreen && currentScreen !== 'thank_you' && (
        <div className="px-4 pt-2 pb-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] leading-[18px]" style={{ color: 'var(--lj-muted)' }} data-testid="wizard-progress">Step {currentStep} of {totalSteps}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#EDEDEB' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, background: 'var(--lj-accent)', transition: 'width 500ms var(--lj-ease)' }} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
