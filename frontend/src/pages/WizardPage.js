import React from 'react';
import { useWizard } from '../context/WizardContext';
import WizardShell from '../components/wizard/WizardShell';
import FloatingWidget from '../components/wizard/FloatingWidget';
import LandingScreen from '../components/wizard/screens/LandingScreen';
import SingleSelectScreen from '../components/wizard/SingleSelectScreen';
import DiamondShapeScreen from '../components/wizard/DiamondShapeScreen';
import BraceletScreen from '../components/wizard/screens/BraceletScreen';
import RingSizeScreen from '../components/wizard/screens/RingSizeScreen';
import InspirationScreen from '../components/wizard/screens/InspirationScreen';
import ValueRevealScreen from '../components/wizard/screens/ValueRevealScreen';
import ContactScreen from '../components/wizard/screens/ContactScreen';
import ThankYouScreen from '../components/wizard/screens/ThankYouScreen';
import {
  PRODUCT_TYPES,
  OCCASIONS,
  DEADLINES,
  SETTING_STYLES,
  DIAMOND_SHAPES,
  CARAT_RANGES,
  PRIORITIES,
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
        return (
          <SingleSelectScreen
            screenId="diamond_shape"
            title="Preferred diamond shape?"
            subtitle="Each shape has its own unique character"
            options={DIAMOND_SHAPES}
            field="diamond_shape"
          />
        );
      
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
        return (
          <SingleSelectScreen
            screenId="priority"
            title="If you had to prioritize one thing..."
            subtitle="What matters most to you?"
            options={PRIORITIES}
            field="priority"
            showDesc={true}
          />
        );
      
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
      
      case 'value_reveal':
        return <ValueRevealScreen />;
      
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
        {renderScreen()}
      </WizardShell>
      <FloatingWidget />
    </>
  );
}
