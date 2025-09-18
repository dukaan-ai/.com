
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface NewOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, order, onUpdateStatus }) => {
  const [timeLeft, setTimeLeft] = useState(600); // 60s in tenths of a second
  const timerIntervalRef = useRef<number | null>(null);
  const { t } = useLanguage();

  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const swipeDeltaRef = useRef(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const handleCloseAndReject = useCallback(() => {
    if (order) {
        onUpdateStatus(order.id, OrderStatus.REJECTED);
    }
  }, [order, onUpdateStatus]);

  useEffect(() => {
    if (isOpen && order) {
      setTimeLeft(600); // Reset timer to 60 seconds

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            handleCloseAndReject();
            return 0;
          }
          return prev - 1;
        });
      }, 100);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isOpen, order, handleCloseAndReject]);

  // Swipe logic
  const getClientX = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): number =>
    'touches' in e ? e.touches[0].clientX : e.clientX, []);

  const handleSwipeStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!order) return;
    e.preventDefault();
    if (handleRef.current) {
        handleRef.current.style.transition = 'none';
    }
    setSwipeStartX(getClientX(e));
    setIsSwiping(true);
  }, [order, getClientX]);

  const handleSwipeEnd = useCallback(() => {
    if (!isSwiping || !order) return;
    setIsSwiping(false);
    if (sliderRef.current) {
        const sliderWidth = sliderRef.current.offsetWidth;
        const acceptanceThreshold = sliderWidth * 0.7;

        if (swipeDeltaRef.current > acceptanceThreshold) {
            onUpdateStatus(order.id, OrderStatus.PREPARING);
        } else {
             if (handleRef.current) {
                handleRef.current.style.transition = 'transform 0.3s ease-out';
                handleRef.current.style.transform = 'translateX(0px)';
            }
        }
    }
  }, [isSwiping, order, onUpdateStatus]);

  const handleSwipeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isSwiping) return;

    const currentX = getClientX(e);
    let delta = currentX - swipeStartX;

    if (sliderRef.current && handleRef.current) {
        const sliderWidth = sliderRef.current.offsetWidth;
        const handleWidth = handleRef.current.offsetWidth;
        const maxSwipe = sliderWidth - handleWidth;
        delta = Math.max(0, Math.min(delta, maxSwipe));
        swipeDeltaRef.current = delta;
        handleRef.current.style.transform = `translateX(${delta}px)`;
    }
  }, [isSwiping, swipeStartX, getClientX]);

  useEffect(() => {
    if (isSwiping) {
        window.addEventListener('mousemove', handleSwipeMove);
        window.addEventListener('touchmove', handleSwipeMove);
        window.addEventListener('mouseup', handleSwipeEnd);
        window.addEventListener('touchend', handleSwipeEnd);
    }

    return () => {
        window.removeEventListener('mousemove', handleSwipeMove);
        window.removeEventListener('touchmove', handleSwipeMove);
        window.removeEventListener('mouseup', handleSwipeEnd);
        window.removeEventListener('touchend', handleSwipeEnd);
    };
  }, [isSwiping, handleSwipeMove, handleSwipeEnd]);

  if (!isOpen || !order) return null;

  const customerFirstName = order.customer.name?.split(' ')[0] || order.id;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-70 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleCloseAndReject}
        aria-hidden="true"
      />
      <div
        className={`fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-[#1A1A1A] text-white rounded-t-2xl z-50 transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-order-title"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-[#2D2D2D] rounded-t-2xl overflow-hidden">
            <div 
                className="h-full bg-red-500 transition-all duration-100 ease-linear"
                style={{ width: `${(timeLeft / 600) * 100}%` }}
            />
        </div>
        
        <div className="p-6 pt-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-2">
                <h3 id="new-order-title" className="text-lg font-bold text-white">
                  {t('new_order_received')}
                </h3>
                <p className="text-sm font-semibold text-neutral-400 truncate">{customerFirstName} &bull; {order.customer.address}</p>
              </div>
            </div>

            <div className="space-y-3">
                <div>
                    <p className="text-sm font-medium text-neutral-400 px-1 mb-2">{t('items')}</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto hide-scrollbar">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-[#2D2D2D] p-2 rounded-lg">
                                <div className="flex-1 pr-2">
                                    <p className="font-semibold text-white truncate">{t(item.name)}</p>
                                    <p className="text-sm text-neutral-400">{item.quantity} x {item.price}</p>
                                </div>
                                <p className="font-semibold text-neutral-200">₹{(item.quantity * parseFloat(item.price.replace('₹', ''))).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center bg-[#2D2D2D] p-3 rounded-lg">
                    <div>
                        <p className="font-bold text-white text-lg">{t('total_bill')}</p>
                        <p className="text-sm text-neutral-400 font-semibold">{t('payment')}: {order.paymentMethod}</p>
                    </div>
                    <p className="font-bold text-2xl text-[#E6E6FA]">₹{order.total.toFixed(2)}</p>
                </div>

                <div className="pt-2">
                  <div 
                    ref={sliderRef} 
                    className="relative w-full bg-[#2D2D2D] rounded-full h-14 flex items-center justify-center overflow-hidden select-none"
                  >
                    <p className={`text-neutral-300 font-semibold z-10 transition-opacity duration-200 pointer-events-none`}>
                      {t('swipe_to_accept')}
                    </p>
                    <div
                      ref={handleRef}
                      className={`absolute top-0 left-0 h-full w-14 bg-[#E6E6FA] rounded-full flex items-center justify-center z-20 cursor-grab active:cursor-grabbing`}
                      onMouseDown={handleSwipeStart}
                      onTouchStart={handleSwipeStart}
                    >
                      <span className="material-symbols-outlined text-black font-bold">chevron_right</span>
                    </div>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default NewOrderModal;