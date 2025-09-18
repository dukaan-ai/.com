import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, DocumentIcon, WhatsAppIcon, XIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface UploadMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadMenu: React.FC<UploadMenuProps> = ({ isOpen, onClose }) => {
  const [showWhatsAppInstructions, setShowWhatsAppInstructions] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (isOpen) {
      mainElement?.classList.add('overflow-hidden');
    } else {
      mainElement?.classList.remove('overflow-hidden');
    }
    return () => {
      mainElement?.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  const handleWhatsAppClick = () => {
    setShowWhatsAppInstructions(true);
  };

  const handleBack = () => {
    setShowWhatsAppInstructions(false);
  };
  
  const handleClose = () => {
    setShowWhatsAppInstructions(false);
    onClose();
  };

  const handleUploadCsvClick = () => {
    csvInputRef.current?.click();
  };

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`Selected CSV file: ${file.name}. Upload functionality would be implemented here.`);
      handleClose();
    }
    if(event.target) {
        event.target.value = '';
    }
  };
  
  const handleUploadPhotoClick = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`Selected image: ${file.name}. Upload functionality would be implemented here.`);
      handleClose();
    }
    if(event.target) {
        event.target.value = '';
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-70 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-[#1A1A1A] text-white rounded-t-2xl p-6 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {!showWhatsAppInstructions ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">{t('upload_data')}</h3>
              <button onClick={handleClose} className="text-neutral-400 hover:text-white">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <ul className="space-y-3">
              <li>
                <button onClick={handleUploadPhotoClick} className="w-full flex items-center p-4 bg-[#2D2D2D] rounded-lg text-left hover:bg-opacity-80 transition-colors">
                  <CameraIcon className="w-6 h-6 mr-4 text-[#E6E6FA]" />
                  <span className="font-semibold text-neutral-200">{t('upload_photo_bill')}</span>
                </button>
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
              </li>
              <li>
                <button onClick={handleUploadCsvClick} className="w-full flex items-center p-4 bg-[#2D2D2D] rounded-lg text-left hover:bg-opacity-80 transition-colors">
                  <DocumentIcon className="w-6 h-6 mr-4 text-[#E6E6FA]" />
                  <span className="font-semibold text-neutral-200">{t('upload_csv')}</span>
                </button>
                <input
                  type="file"
                  ref={csvInputRef}
                  onChange={handleCsvFileChange}
                  accept=".csv,text/csv"
                  className="hidden"
                />
              </li>
              <li>
                <button onClick={handleWhatsAppClick} className="w-full flex items-center p-4 bg-[#2D2D2D] rounded-lg text-left hover:bg-opacity-80 transition-colors">
                  <WhatsAppIcon className="w-6 h-6 mr-4 text-[#25D366]" />
                  <span className="font-semibold text-neutral-200">{t('record_on_whatsapp')}</span>
                </button>
              </li>
            </ul>
          </>
        ) : (
          <div className="text-center">
            <WhatsAppIcon className="w-12 h-12 text-[#25D366] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">{t('whatsapp_ready_title')}</h3>
            <p className="text-neutral-300 mb-6">{t('whatsapp_ready_desc')}</p>
            <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-[#25D366] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#1EBE57] transition-colors">
              {t('open_whatsapp')}
            </a>
            <button onClick={handleBack} className="mt-4 text-sm font-semibold text-neutral-400 hover:text-white">
              {t('back')}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default UploadMenu;