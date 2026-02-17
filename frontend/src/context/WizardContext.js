import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { getScreenFlow, getWizardStepCount } from '../utils/wizardConfig';
import { getAnonymousId, getSessionId, captureAttribution, trackEvent } from '../utils/analytics';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const STORAGE_KEY = 'tlj_wizard_state';

const WizardContext = createContext(null);

const initialState = {
  currentScreen: 'landing',
  answers: {},
  leadId: null,
  anonymousId: getAnonymousId(),
  sessionId: getSessionId(),
  attribution: {},
  frozenStepTotal: null,
  isSubmitting: false,
  isSubmitted: false,
  submitResult: null,
  uploadedFiles: [],
  inspirationLinks: [],
};

function wizardReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_STATE':
      return { ...state, ...action.payload };
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.screen };
    case 'SET_ANSWER': {
      const newAnswers = { ...state.answers, [action.field]: action.value };
      return { ...state, answers: newAnswers };
    }
    case 'SET_LEAD_ID':
      return { ...state, leadId: action.leadId };
    case 'SET_ATTRIBUTION':
      return { ...state, attribution: action.attribution };
    case 'FREEZE_STEP_TOTAL':
      return { ...state, frozenStepTotal: action.total };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.value };
    case 'SET_SUBMITTED':
      return { ...state, isSubmitted: true, submitResult: action.result };
    case 'ADD_UPLOADED_FILES':
      return { ...state, uploadedFiles: [...state.uploadedFiles, ...action.files] };
    case 'REMOVE_UPLOADED_FILE':
      return { ...state, uploadedFiles: state.uploadedFiles.filter((_, i) => i !== action.index) };
    case 'SET_INSPIRATION_LINKS':
      return { ...state, inspirationLinks: action.links };
    case 'RESET':
      localStorage.removeItem(STORAGE_KEY);
      return { ...initialState, anonymousId: getAnonymousId(), sessionId: getSessionId() };
    default:
      return state;
  }
}

export function WizardProvider({ children }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const autosaveTimer = useRef(null);
  const hasInitialized = useRef(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentScreen && parsed.currentScreen !== 'thank_you') {
          dispatch({ type: 'RESTORE_STATE', payload: parsed });
        }
      } catch (e) {
        // Ignore
      }
    }
    
    // Capture attribution
    const attr = captureAttribution();
    dispatch({ type: 'SET_ATTRIBUTION', attribution: attr });
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    if (state.currentScreen === 'landing' && !state.leadId) return;
    const toSave = {
      currentScreen: state.currentScreen,
      answers: state.answers,
      leadId: state.leadId,
      frozenStepTotal: state.frozenStepTotal,
      uploadedFiles: state.uploadedFiles,
      inspirationLinks: state.inspirationLinks,
      anonymousId: state.anonymousId,
      sessionId: state.sessionId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [state.currentScreen, state.answers, state.leadId, state.frozenStepTotal, state.uploadedFiles, state.inspirationLinks, state.anonymousId, state.sessionId]);

  // Server autosave (debounced)
  const autosaveToServer = useCallback(async () => {
    if (!state.leadId) return;
    try {
      await axios.put(`${BACKEND_URL}/api/wizard/${state.leadId}/autosave`, {
        answers: state.answers,
        current_step: state.currentScreen,
        frozen_step_total: state.frozenStepTotal,
      });
    } catch (e) {
      // Silent fail
    }
  }, [state.leadId, state.answers, state.currentScreen, state.frozenStepTotal]);

  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      autosaveToServer();
    }, 2000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [autosaveToServer]);

  // Start wizard
  const startWizard = useCallback(async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/wizard/start`, {
        anonymous_id: state.anonymousId,
        session_id: state.sessionId,
        attribution: state.attribution,
      });
      const leadId = res.data.lead_id;
      dispatch({ type: 'SET_LEAD_ID', leadId });
      dispatch({ type: 'SET_SCREEN', screen: 'product_type' });
      
      trackEvent('tlj_wizard_start', {}, { lead_id: leadId, anonymous_id: state.anonymousId, session_id: state.sessionId });
      
      return leadId;
    } catch (e) {
      console.error('Failed to start wizard:', e);
    }
  }, [state.anonymousId, state.sessionId, state.attribution]);

  // Navigate to next screen
  const goNext = useCallback((fromScreen) => {
    const flow = getScreenFlow(state.answers);
    const currentIndex = flow.indexOf(fromScreen || state.currentScreen);
    
    // Freeze step total after first question (product_type)
    if (fromScreen === 'product_type' && state.frozenStepTotal === null) {
      const total = getWizardStepCount(state.answers);
      dispatch({ type: 'FREEZE_STEP_TOTAL', total });
    }
    
    if (currentIndex >= 0 && currentIndex < flow.length - 1) {
      const nextScreen = flow[currentIndex + 1];
      dispatch({ type: 'SET_SCREEN', screen: nextScreen });
      trackEvent('tlj_step_complete', { step_id: fromScreen || state.currentScreen }, { lead_id: state.leadId });
      trackEvent('tlj_step_view', { step_id: nextScreen }, { lead_id: state.leadId });
    }
  }, [state.answers, state.currentScreen, state.frozenStepTotal, state.leadId]);

  // Navigate back
  const goBack = useCallback(() => {
    const flow = getScreenFlow(state.answers);
    const currentIndex = flow.indexOf(state.currentScreen);
    if (currentIndex > 1) { // Don't go back past product_type to landing
      const prevScreen = flow[currentIndex - 1];
      dispatch({ type: 'SET_SCREEN', screen: prevScreen });
      trackEvent('tlj_step_back', { from_step_id: state.currentScreen, to_step_id: prevScreen }, { lead_id: state.leadId });
    }
  }, [state.answers, state.currentScreen, state.leadId]);

  // Set answer
  const setAnswer = useCallback((field, value) => {
    dispatch({ type: 'SET_ANSWER', field, value });
  }, []);

  // Submit lead
  const submitLead = useCallback(async (contactData) => {
    dispatch({ type: 'SET_SUBMITTING', value: true });
    try {
      const allAnswers = {
        ...state.answers,
        inspiration_files: state.uploadedFiles,
        inspiration_links: state.inspirationLinks,
      };
      
      const res = await axios.post(`${BACKEND_URL}/api/leads/submit`, {
        lead_id: state.leadId,
        first_name: contactData.first_name,
        email: contactData.email,
        phone: contactData.phone || '',
        notes: contactData.notes || '',
        answers: allAnswers,
        attribution: state.attribution,
      });
      
      dispatch({ type: 'SET_SUBMITTED', result: res.data });
      
      // Store token
      if (res.data.token) {
        localStorage.setItem('tlj_token', res.data.token);
        localStorage.setItem('tlj_user', JSON.stringify({ first_name: res.data.first_name, email: contactData.email }));
      }
      
      trackEvent('tlj_lead_created', { lead_id: state.leadId }, { lead_id: state.leadId });
      
      dispatch({ type: 'SET_SCREEN', screen: 'thank_you' });
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to submit lead:', e);
      throw e;
    } finally {
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  }, [state.answers, state.leadId, state.attribution, state.uploadedFiles, state.inspirationLinks]);

  const value = {
    state,
    dispatch,
    startWizard,
    goNext,
    goBack,
    setAnswer,
    submitLead,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) throw new Error('useWizard must be used within WizardProvider');
  return context;
}
