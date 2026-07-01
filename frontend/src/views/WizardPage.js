'use client';
import React, { Suspense, lazy } from 'react';
import { useWizard } from '../context/WizardContext';
import WizardShell from '../components/wizard/WizardShell';
import FloatingWidget from '../components/wizard/FloatingWidget';
import LandingScreen from '../components/wizard/screens/LandingScreen';
// Non-landing wizard screens are code-split: they only render after the user
// starts the wizard (client interaction), so lazy-loading keeps them out of the
// homepage's initial JS bundle without affecting SSR/SEO (only LandingScreen is
// server-rendered on the homepage).
const HowItWorksScreen = lazy(() => import('../components/wizard/screens/HowItWorksScreen'));
const SingleSelectScreen = lazy(() => import('../components/wizard/SingleSelectScreen'));
const DiamondShapeScreen = lazy(() => import('../components/wizard/DiamondShapeScreen'));
const BraceletScreen = lazy(() => import('../components/wizard/screens/BraceletScreen'));
const RingSizeScreen = lazy(() => import('../components/wizard/screens/RingSizeScreen'));
const InspirationScreen = lazy(() => import('../components/wizard/screens/InspirationScreen'));
const ContactScreen = lazy(() => import('../components/wizard/screens/ContactScreen'));
const ThankYouScreen = lazy(() => import('../components/wizard/screens/ThankYouScreen'));
import {
  PRODUCT_TYPES,
  OCCASIONS,
  DEADLINES,
  SETTING_STYLES,
  DIAMOND_SHAPES,
  CARAT_RANGES,
  METALS,
  BUDGETS,
} from '../utils/wizardConfig';

export default function WizardPage() {
  const { state } = useWizard();
  const { currentScreen } = state;

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return <LandingScreen />;
      
      case 'how_it_works':
        return <HowItWorksScreen />;
      
      case 'product_type':
        return (
          <SingleSelectScreen
            screenId="product_type"
            title="What are you shopping for?"
            subtitle="Select one to get started"
            options={PRODUCT_TYPES}
            field="product_type"
          />
        );
      
      case 'occasion':
        return (
          <SingleSelectScreen
            screenId="occasion"
            title="What's the occasion?"
            options={OCCASIONS}
            field="occasion"
          />
        );
      
      case 'deadline':
        return (
          <SingleSelectScreen
            screenId="deadline"
            title="Do you have a deadline?"
            options={DEADLINES}
            field="deadline"
          />
        );
      
      case 'setting_style':
        return (
          <SingleSelectScreen
            screenId="setting_style"
            title="What setting style do you prefer?"
            subtitle="Choose a style that catches your eye"
            options={SETTING_STYLES}
            field="setting_style"
            showDesc={true}
          />
        );
      
      case 'bracelet_specifics':
        return <BraceletScreen />;
      
      case 'diamond_shape':
        return <DiamondShapeScreen />;
      
      case 'carat_range':
        return (
          <SingleSelectScreen
            screenId="carat_range"
            title="Target carat size?"
            options={CARAT_RANGES}
            field="carat_range"
          />
        );
      
      case 'priority':
      case 'value_reveal':
        // Deprecated screens, kept here as no-op so old saved sessions don't crash. They are no longer in the flow.
        return <LandingScreen />;
      
      case 'metal':
        return (
          <SingleSelectScreen
            screenId="metal"
            title="Metal preference?"
            options={METALS}
            field="metal"
          />
        );
      
      case 'ring_size_known':
        return (
          <SingleSelectScreen
            screenId="ring_size_known"
            title="Do you know the ring size?"
            options={[
              { id: 'yes', label: 'Yes, I know it', icon: 'Check' },
              { id: 'no', label: 'No / Not sure', icon: 'HelpCircle' },
            ]}
            field="ring_size_known"
          />
        );
      
      case 'ring_size':
        return <RingSizeScreen />;
      
      case 'budget':
        return (
          <SingleSelectScreen
            screenId="budget"
            title="What budget range feels comfortable?"
            options={BUDGETS}
            field="budget"
          />
        );
      
      case 'has_inspiration':
        return (
          <SingleSelectScreen
            screenId="has_inspiration"
            title="Do you have any inspiration?"
            subtitle="Photos or links to styles you love"
            options={[
              { id: 'yes', label: 'Yes, I have something to share', icon: 'Image' },
              { id: 'no', label: 'No, I need guidance', icon: 'HelpCircle' },
            ]}
            field="has_inspiration"
          />
        );
      
      case 'inspiration_upload':
        return <InspirationScreen />;
      
      case 'contact':
        return <ContactScreen />;
      
      case 'thank_you':
        return <ThankYouScreen />;
      
      default:
        return <LandingScreen />;
    }
  };

  return (
    <>
      <WizardShell>
        <Suspense fallback={<div style={{ minHeight: '40vh' }} aria-hidden="true" />}>
          {renderScreen()}
        </Suspense>
      </WizardShell>
      <FloatingWidget />
    </>
  );
}