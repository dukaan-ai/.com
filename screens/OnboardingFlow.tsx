import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const NameStep: React.FC<{ onNext: (name: string) => void; onSkip: () => void }> = ({ onNext, onSkip }) => {
  const [name, setName] = useState('');

  const handleContinue = () => {
    if (name.trim()) {
      onNext(name.trim());
    }
  };

  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
      <h2 className="text-white text-2xl font-bold mb-6">What should we call you?</h2>
      <div className="mb-6">
        <input
          className="w-full bg-transparent border-t-0 border-x-0 border-b-2 border-neutral-600 text-white text-lg text-center py-2 focus:outline-none focus:ring-0 focus:border-[#E6E6FA] placeholder-neutral-400 transition-colors duration-300"
          placeholder="Enter your name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleContinue()}
        />
      </div>
      <button
        onClick={handleContinue}
        disabled={!name.trim()}
        className="w-full bg-[#E6E6FA] text-black font-semibold py-3 rounded-full text-lg hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
      <button
        onClick={onSkip}
        className="w-full text-neutral-300 font-semibold py-2 text-md hover:text-white transition-opacity mt-2"
      >
        Skip for now
      </button>
    </div>
  );
};

const StoreDetailsStep: React.FC<{ onComplete: (details: { storeName: string; storeAddress: string; storeCategory: string }) => void; onSkip: () => void }> = ({ onComplete, onSkip }) => {
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeCategory, setStoreCategory] = useState('');
  const { t } = useLanguage();

  const handleContinue = () => {
    if (storeName.trim() && storeAddress.trim() && storeCategory.trim()) {
      onComplete({ storeName, storeAddress, storeCategory });
    }
  };
  
  const canContinue = storeName.trim() && storeAddress.trim() && storeCategory.trim();

  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-6 max-w-sm w-full text-center shadow-lg">
      <h2 className="text-white text-2xl font-bold mb-6">Set up your store</h2>
      <div className="space-y-6 text-left">
        <div>
          <label className="text-white font-bold" htmlFor="store-name">{t('label_store_name')}</label>
          <input
            className="w-full bg-transparent border-t-0 border-x-0 border-b-2 border-neutral-600 text-white text-lg py-2 focus:outline-none focus:ring-0 focus:border-[#E6E6FA] placeholder-neutral-400 transition-colors duration-300"
            id="store-name"
            placeholder={t('placeholder_store_name_example')}
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-white font-bold" htmlFor="store-address">{t('label_store_address')}</label>
          <div className="relative">
            <input
              className="w-full bg-transparent border-t-0 border-x-0 border-b-2 border-neutral-600 text-white text-lg py-2 pr-10 focus:outline-none focus:ring-0 focus:border-[#E6E6FA] placeholder-neutral-400 transition-colors duration-300"
              id="store-address"
              placeholder={t('placeholder_store_address_example')}
              type="text"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="material-symbols-outlined text-neutral-500">place</span>
            </span>
          </div>
        </div>
        <div>
          <label className="text-white font-bold" htmlFor="store-category">{t('label_store_category')}</label>
          <div className="relative mt-1">
            <select
              className="appearance-none w-full bg-transparent border-t-0 border-x-0 border-b-2 border-neutral-600 text-white text-lg py-2.5 focus:outline-none focus:ring-0 focus:border-[#E6E6FA] transition-colors duration-300"
              id="store-category"
              value={storeCategory}
              onChange={(e) => setStoreCategory(e.target.value)}
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23e6e6fa' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.5em 1.5em' }}
            >
              <option className="bg-[#1A1A1A] text-white" value="">{t('onboarding_select_category')}</option>
              <option className="bg-[#1A1A1A] text-white" value={t('category_grocery')}>{t('category_grocery')}</option>
              <option className="bg-[#1A1A1A] text-white" value={t('category_electronics')}>{t('category_electronics')}</option>
              <option className="bg-[#1A1A1A] text-white" value={t('category_fashion')}>{t('category_fashion')}</option>
               <option className="bg-[#1A1A1A] text-white" value={t('category_other')}>{t('category_other')}</option>
            </select>
          </div>
        </div>
      </div>
      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full bg-[#E6E6FA] text-black font-semibold py-3 rounded-full text-lg hover:bg-opacity-90 transition-opacity mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
      <button
        onClick={onSkip}
        className="w-full text-neutral-300 font-semibold py-2 text-md hover:text-white transition-opacity mt-2"
      >
        Skip for now
      </button>
    </div>
  );
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'name' | 'storeDetails'>('name');

  const handleNameNext = (name: string) => {
    localStorage.setItem('dukan-profile-name', name);
    setStep('storeDetails');
  };

  const handleStoreDetailsComplete = (details: { storeName: string; storeAddress: string; storeCategory: string }) => {
    localStorage.setItem('dukan-store-name', details.storeName);
    localStorage.setItem('dukan-store-address', details.storeAddress);
    localStorage.setItem('dukan-store-category', details.storeCategory);
    localStorage.setItem('dukan-onboarding-complete', 'true');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('dukan-onboarding-complete', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        {step === 'name' && <NameStep onNext={handleNameNext} onSkip={handleSkip} />}
        {step === 'storeDetails' && <StoreDetailsStep onComplete={handleStoreDetailsComplete} onSkip={handleSkip} />}
    </div>
  );
};

export default OnboardingFlow;