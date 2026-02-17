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
  isAdvancing: false,
};

function wizardReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_STATE':
      return { ...state, ...action.payload, isAdvancing: false };
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.screen, isAdvancing: false };
    case 'SET_ANSWER': {
      const newAnswers = { ...state.answers, [action.field]: action.value };
      return { ...state, answers: newAnswers };
    }
    case 'SET_ANSWER_AND_ADVANCE': {
      // Guard against rapid double-clicks
      if (state.isAdvancing) return state;
      
      const newAnswers = { ...state.answers, [action.field]: action.value };
      const flow = getScreenFlow(newAnswers);
      const currentIndex = flow.indexOf(action.fromScreen);
      let newFrozenTotal = state.frozenStepTotal;
      
      // Freeze step total after product_type selection
      if (action.fromScreen === 'product_type' && state.frozenStepTotal === null) {
        newFrozenTotal = getWizardStepCount(newAnswers);
      }
      
      if (currentIndex >= 0 && currentIndex < flow.length - 1) {
        const nextScreen = flow[currentIndex + 1];
        return { 
          ...state, 
          answers: newAnswers, 
          currentScreen: nextScreen,
          frozenStepTotal: newFrozenTotal,
          isAdvancing: true,
        };
      }
      return { ...state, answers: newAnswers, frozenStepTotal: newFrozenTotal };
    }
    case 'CLEAR_ADVANCING':
      return { ...state, isAdvancing: false };
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
  const stateRef = useRef(state);
  
  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Clear advancing flag after screen change
  useEffect(() => {
    if (state.isAdvancing) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_ADVANCING' }), 300);
      return () => clearTimeout(t);
    }
  }, [state.isAdvancing]);

  // Restore state from localStorage on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if we have meaningful state (not just landing)
        if (parsed && parsed.currentScreen && parsed.currentScreen !== 'landing' && parsed.currentScreen !== 'thank_you' && parsed.leadId) {
          dispatch({ type: 'RESTORE_STATE', payload: {
            currentScreen: parsed.currentScreen,
            answers: parsed.answers || {},
            leadId: parsed.leadId,
            frozenStepTotal: parsed.frozenStepTotal,
            uploadedFiles: parsed.uploadedFiles || [],
            inspirationLinks: parsed.inspirationLinks || [],
          }});
        }
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    }
    
    // Capture attribution
    const attr = captureAttribution();
    dispatch({ type: 'SET_ATTRIBUTION', attribution: attr });
  }, []);

  // Save to localStorage on meaningful state changes
  useEffect(() => {
    if (!state.leadId) return; // Don't save before wizard starts
    if (state.currentScreen === 'thank_you') {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    
    const toSave = {
      currentScreen: state.currentScreen,
      answers: state.answers,
      leadId: state.leadId,
      frozenStepTotal: state.frozenStepTotal,
      uploadedFiles: state.uploadedFiles,
      inspirationLinks: state.inspirationLinks,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [state.currentScreen, state.answers, state.leadId, state.frozenStepTotal, state.uploadedFiles, state.inspirationLinks]);

  // Server autosave (debounced)
  const autosaveToServer = useCallback(async () => {
    const s = stateRef.current;
    if (!s.leadId || s.currentScreen === 'landing' || s.currentScreen === 'thank_you') return;
    try {
      await axios.put(`${BACKEND_URL}/api/wizard/${s.leadId}/autosave`, {
        answers: s.answers,
        current_step: s.currentScreen,
        frozen_step_total: s.frozenStepTotal,
      });
    } catch (e) {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (state.leadId && state.currentScreen !== 'landing' && state.currentScreen !== 'thank_you') {
      autosaveTimer.current = setTimeout(autosaveToServer, 2000);
    }
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [state.answers, state.currentScreen, state.leadId, autosaveToServer]);

  // Start wizard
  const startWizard = useCallback(async () => {
    try {
      const s = stateRef.current;
      const res = await axios.post(`${BACKEND_URL}/api/wizard/start`, {
        anonymous_id: s.anonymousId,
        session_id: s.sessionId,
        attribution: s.attribution,
      });
      const leadId = res.data.lead_id;
      dispatch({ type: 'SET_LEAD_ID', leadId });
      dispatch({ type: 'SET_SCREEN', screen: 'product_type' });
      
      trackEvent('tlj_wizard_start', {}, { lead_id: leadId, anonymous_id: s.anonymousId, session_id: s.sessionId });
      
      return leadId;
    } catch (e) {
      console.error('Failed to start wizard:', e);
    }
  }, []);

  // Set answer AND advance (atomic operation)
  const setAnswerAndAdvance = useCallback((field, value, fromScreen) => {
    dispatch({ type: 'SET_ANSWER_AND_ADVANCE', field, value, fromScreen });
    trackEvent('tlj_step_complete', { step_id: fromScreen }, { lead_id: stateRef.current.leadId });
  }, []);

  // Navigate to next screen (for manual advance buttons)
  const goNext = useCallback((fromScreen) => {
    const s = stateRef.current;
    const flow = getScreenFlow(s.answers);
    const currentIndex = flow.indexOf(fromScreen || s.currentScreen);
    
    if (fromScreen === 'product_type' && s.frozenStepTotal === null) {
      const total = getWizardStepCount(s.answers);
      dispatch({ type: 'FREEZE_STEP_TOTAL', total });
    }
    
    if (currentIndex >= 0 && currentIndex < flow.length - 1) {
      const nextScreen = flow[currentIndex + 1];
      dispatch({ type: 'SET_SCREEN', screen: nextScreen });
      trackEvent('tlj_step_complete', { step_id: fromScreen || s.currentScreen }, { lead_id: s.leadId });
    }
  }, []);

  // Navigate back
  const goBack = useCallback(() => {
    const s = stateRef.current;
    const flow = getScreenFlow(s.answers);
    const currentIndex = flow.indexOf(s.currentScreen);
    if (currentIndex > 1) {
      const prevScreen = flow[currentIndex - 1];
      dispatch({ type: 'SET_SCREEN', screen: prevScreen });
      trackEvent('tlj_step_back', { from_step_id: s.currentScreen, to_step_id: prevScreen }, { lead_id: s.leadId });
    }
  }, []);

  // Set answer (without advancing)
  const setAnswer = useCallback((field, value) => {
    dispatch({ type: 'SET_ANSWER', field, value });
  }, []);

  // Submit lead
  const submitLead = useCallback(async (contactData) => {
    dispatch({ type: 'SET_SUBMITTING', value: true });
    try {
      const s = stateRef.current;
      const allAnswers = {
        ...s.answers,
        inspiration_files: s.uploadedFiles,
        inspiration_links: s.inspirationLinks,
      };
      
      const res = await axios.post(`${BACKEND_URL}/api/leads/submit`, {
        lead_id: s.leadId,
        first_name: contactData.first_name,
        phone: contactData.phone,
        email: contactData.email || '',
        notes: contactData.notes || '',
        answers: allAnswers,
        attribution: s.attribution,
      });
      
      dispatch({ type: 'SET_SUBMITTED', result: res.data });
      
      if (res.data.token) {
        localStorage.setItem('tlj_token', res.data.token);
        localStorage.setItem('tlj_user', JSON.stringify({ first_name: res.data.first_name, phone: contactData.phone, email: contactData.email }));
      }
      
      trackEvent('tlj_lead_created', { lead_id: s.leadId }, { lead_id: s.leadId });
      
      dispatch({ type: 'SET_SCREEN', screen: 'thank_you' });
    } catch (e) {
      console.error('Failed to submit lead:', e);
      throw e;
    } finally {
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  }, []);

  const value = {
    state,
    dispatch,
    startWizard,
    goNext,
    goBack,
    setAnswer,
    setAnswerAndAdvance,
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
