// Wizard screen configuration and branching logic

export const PRODUCT_TYPES = [
  { id: 'engagement_ring', label: 'Engagement Ring', icon: 'Gem' },
  { id: 'wedding_bands', label: 'Wedding Bands', icon: 'CircleDot' },
  { id: 'tennis_bracelet', label: 'Tennis Bracelet', icon: 'Watch' },
  { id: 'studs_earrings', label: 'Studs / Earrings', icon: 'Sparkles' },
  { id: 'necklace_pendant', label: 'Necklace / Pendant', icon: 'Link' },
  { id: 'loose_diamond', label: 'Loose Diamond', icon: 'Diamond' },
  { id: 'price_checking', label: 'Just price-checking', icon: 'Search' },
];

export const OCCASIONS = [
  { id: 'proposal', label: 'Proposal', icon: 'Heart' },
  { id: 'anniversary', label: 'Anniversary', icon: 'Calendar' },
  { id: 'treating_myself', label: 'Treating myself', icon: 'Gift' },
  { id: 'gift_for_someone', label: 'Gift for someone', icon: 'Gift' },
  { id: 'upgrade_replace', label: 'Upgrade / Replace existing', icon: 'RefreshCw' },
  { id: 'other', label: 'Other', icon: 'MoreHorizontal' },
];

export const DEADLINES = [
  { id: 'asap', label: 'ASAP (within 2 weeks)', icon: 'Zap' },
  { id: 'within_1_month', label: 'Within 1 month', icon: 'Calendar' },
  { id: '1_3_months', label: '1 \u2013 3 months', icon: 'Calendar' },
  { id: '3_plus_months', label: '3+ months / No rush', icon: 'Clock' },
  { id: 'not_sure', label: 'Not sure yet', icon: 'HelpCircle' },
];

export const SETTING_STYLES = [
  { id: 'solitaire', label: 'Solitaire', desc: 'Classic, single stone' },
  { id: 'halo', label: 'Halo', desc: 'Stones surrounding center' },
  { id: 'three_stone', label: 'Three-stone', desc: '' },
  { id: 'pave_side_stones', label: 'Pav\u00e9 / Side stones', desc: '' },
  { id: 'vintage_art_deco', label: 'Vintage / Art Deco', desc: '' },
  { id: 'hidden_halo', label: 'Hidden halo', desc: '' },
  { id: 'not_sure', label: 'Not sure \u2014 show me options', desc: '' },
];

export const DIAMOND_SHAPES = [
  { id: 'round', label: 'Round', icon: 'Circle' },
  { id: 'oval', label: 'Oval', icon: 'CircleDot' },
  { id: 'emerald', label: 'Emerald', icon: 'RectangleHorizontal' },
  { id: 'cushion', label: 'Cushion', icon: 'Square' },
  { id: 'princess', label: 'Princess', icon: 'Diamond' },
  { id: 'pear', label: 'Pear', icon: 'Droplet' },
  { id: 'radiant', label: 'Radiant', icon: 'Octagon' },
  { id: 'asscher', label: 'Asscher', icon: 'Square' },
  { id: 'marquise', label: 'Marquise', icon: 'MoveHorizontal' },
  { id: 'heart', label: 'Heart', icon: 'Heart' },
  { id: 'not_sure', label: 'Other', icon: 'HelpCircle' },
];

export const CARAT_RANGES = [
  { id: '0.5_0.9', label: '0.5 \u2013 0.9 ct' },
  { id: '1.0_1.4', label: '1.0 \u2013 1.4 ct' },
  { id: '1.5_1.9', label: '1.5 \u2013 1.9 ct' },
  { id: '2.0_2.9', label: '2.0 \u2013 2.9 ct' },
  { id: '3.0_plus', label: '3.0+ ct' },
  { id: 'not_sure', label: 'Not sure \u2014 optimize for my budget' },
];

export const PRIORITIES = [
  { id: 'biggest_look', label: 'Biggest look', desc: 'Maximize size', icon: 'Maximize2' },
  { id: 'whitest_color', label: 'Whitest color', desc: 'D\u2013F range', icon: 'Sparkle' },
  { id: 'cleanest_clarity', label: 'Cleanest clarity', desc: 'Eye-clean+', icon: 'Eye' },
  { id: 'best_sparkle', label: 'Best sparkle', desc: 'Excellent cut', icon: 'Sparkles' },
  { id: 'best_value', label: 'Best overall value', desc: 'Balanced', icon: 'Scale' },
];

export const METALS = [
  { id: 'platinum', label: 'Platinum' },
  { id: '14k_white_gold', label: '14K White Gold' },
  { id: '14k_yellow_gold', label: '14K Yellow Gold' },
  { id: '14k_rose_gold', label: '14K Rose Gold' },
  { id: '18k_white_gold', label: '18K White Gold' },
  { id: '18k_yellow_gold', label: '18K Yellow Gold' },
  { id: '18k_rose_gold', label: '18K Rose Gold' },
  { id: 'silver', label: 'Silver' },
  { id: 'not_sure', label: 'Not sure' },
];

export const BUDGETS = [
  { id: 'under_2000', label: 'Under $2,000' },
  { id: '2000_5000', label: '$2,000 \u2013 $5,000' },
  { id: '5000_10000', label: '$5,000 \u2013 $10,000' },
  { id: '10000_15000', label: '$10,000 \u2013 $15,000' },
  { id: '15000_plus', label: '$15,000+' },
  { id: 'not_sure', label: 'Not sure \u2014 optimize for value' },
];

export const WRIST_SIZES = [
  '6"', '6.5"', '7"', '7.5"', '8"', 'Not sure'
];

export const RING_SIZES = [
  '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5',
  '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13'
];

// Branching logic: determines the flow of screens based on answers
export function getScreenFlow(answers) {
  const flow = ['landing']; // Screen 0
  flow.push('product_type'); // Screen 1
  
  const product = answers.product_type;
  
  // Screen 2: Occasion (Engagement Ring or Wedding Bands only)
  if (product === 'engagement_ring' || product === 'wedding_bands') {
    flow.push('occasion');
    
    // Screen 2A: Deadline (only if Proposal)
    if (answers.occasion === 'proposal') {
      flow.push('deadline');
    }
    
    // Screen 3: Setting Style
    flow.push('setting_style');
  } else if (product === 'tennis_bracelet') {
    // Screen 3B: Bracelet Specifics
    flow.push('bracelet_specifics');
  }
  // Studs, Necklace, Loose Diamond, Price-checking go straight to diamond shape
  
  // Screen 4: Diamond Shape
  flow.push('diamond_shape');
  
  // Screen 5: Carat Size
  flow.push('carat_range');
  
  // Screen 6: Priority
  flow.push('priority');
  
  // Screen 7: Metal Preference (skip for Loose Diamond)
  if (product !== 'loose_diamond') {
    flow.push('metal');
  }
  
  // Screen 8: Ring Size (skip for Bracelet, Studs, Necklace, Loose Diamond)
  const skipRingSize = ['tennis_bracelet', 'studs_earrings', 'necklace_pendant', 'loose_diamond'];
  if (!skipRingSize.includes(product)) {
    flow.push('ring_size_known');
    if (answers.ring_size_known === 'yes') {
      flow.push('ring_size');
    }
  }
  
  // Screen 9: Budget
  flow.push('budget');
  
  // Screen 10: Inspiration
  flow.push('has_inspiration');
  if (answers.has_inspiration === 'yes') {
    flow.push('inspiration_upload');
  }
  
  // Screen 11: Value Reveal
  flow.push('value_reveal');
  
  // Screen 12: Contact
  flow.push('contact');
  
  // Screen 13: Thank You
  flow.push('thank_you');
  
  return flow;
}

// Calculate total wizard steps (excluding landing and thank you)
export function getWizardStepCount(answers) {
  const flow = getScreenFlow(answers);
  // Exclude landing and thank_you from count
  return flow.filter(s => s !== 'landing' && s !== 'thank_you').length;
}

// Get current step number (1-based)
export function getCurrentStepNumber(currentScreen, answers) {
  const flow = getScreenFlow(answers);
  const wizardScreens = flow.filter(s => s !== 'landing' && s !== 'thank_you');
  const index = wizardScreens.indexOf(currentScreen);
  return index >= 0 ? index + 1 : 0;
}
