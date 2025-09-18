
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { XIcon, WhatsAppIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onUpdateStatus }) => {
  // Timer state (15s in tenths of a second for smooth animation)
  const [timeLeft, setTimeLeft] = useState(150); 
  const timerIntervalRef = useRef<number | null>(null);
  const { t } = useLanguage();

  // Swipe state
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const swipeDeltaRef = useRef(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // Timer effect for NEW orders
  useEffect(() => {
    if (isOpen && order.status === OrderStatus.NEW) {
      setTimeLeft(150); // Reset timer

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            onUpdateStatus(order.id, OrderStatus.REJECTED);
            return 0;
          }
          return prev - 1;
        });
      }, 100);
    }

    // Cleanup on close or status change
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isOpen, order.id, order.status, onUpdateStatus]);

  // Swipe event handlers
  const getClientX = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): number =>
    'touches' in e ? e.touches[0].clientX : e.clientX, []);

  const handleSwipeStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (order.status !== OrderStatus.NEW) return;
    e.preventDefault();
    if (handleRef.current) {
        handleRef.current.style.transition = 'none';
    }
    setSwipeStartX(getClientX(e));
    setIsSwiping(true);
  }, [order.status, getClientX]);

  const handleSwipeEnd = useCallback(() => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (sliderRef.current) {
        const acceptanceThreshold = sliderRef.current.offsetWidth * 0.7;

        if (swipeDeltaRef.current > acceptanceThreshold) {
            onUpdateStatus(order.id, OrderStatus.PREPARING);
        } else {
            if (handleRef.current) {
                handleRef.current.style.transition = 'transform 0.3s ease-out';
                handleRef.current.style.transform = 'translateX(0px)';
            }
        }
    }
}, [isSwiping, order.id, onUpdateStatus]);

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


  if (!isOpen) return null;

  const getWhatsAppUrl = () => {
      const number = order.customer.whatsappNumber.replace(/[^0-9]/g, '');
      return `https://wa.me/${number}`;
  };

  const ActionButtons: React.FC = () => {
    switch (order.status) {
      case OrderStatus.NEW:
        return (
            <div 
              ref={sliderRef} 
              className="relative w-full bg-[#2D2D2D] rounded-full h-14 flex items-center justify-center overflow-hidden select-none"
            >
              <p className={`text-neutral-300 font-semibold z-10 transition-opacity duration-200 pointer-events-none`}>
                Swipe to Accept
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
        );
      case OrderStatus.PREPARING:
        return (
          <button 
            onClick={() => onUpdateStatus(order.id, OrderStatus.READY_FOR_PICKUP)}
            className="w-full bg-[#E6E6FA] text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
            Ready for Pickup
          </button>
        );
      case OrderStatus.READY_FOR_PICKUP:
        return (
            <div className="text-center p-3 bg-[#2D2D2D] rounded-lg">
                <p className="font-semibold text-purple-300">Waiting for delivery partner.</p>
                <button onClick={() => onUpdateStatus(order.id, OrderStatus.COMPLETED)} className="text-xs text-neutral-400 hover:underline mt-1">
                    Mark as Completed
                </button>
            </div>
        )
      default:
        return null;
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-70 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-[#1A1A1A] text-white rounded-t-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
      >
        {/* Timer Bar */}
        {order.status === OrderStatus.NEW && (
            <div className="absolute top-0 left-0 w-full h-1 bg-[#2D2D2D] rounded-t-2xl overflow-hidden">
                <div 
                    className="h-full bg-red-500 transition-all duration-100 ease-linear"
                    style={{ width: `${(timeLeft / 150) * 100}%` }}
                />
            </div>
        )}
        
        <div className="p-6 pt-5">
            <div className="flex justify-between items-center mb-4">
              <h3 id="order-details-title" className="text-lg font-bold text-white">
                Order {order.id}
              </h3>
              <button onClick={onClose} className="text-neutral-400 hover:text-white" aria-label="Close">
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto hide-scrollbar pb-24">
                <div className="space-y-4">
                    {/* Customer Details */}
                    <div className="bg-[#2D2D2D] p-3 rounded-lg">
                        <p className="text-sm text-neutral-400">Customer</p>
                        <p className="font-bold text-white mt-1">{order.customer.name}</p>
                        <p className="text-sm text-neutral-300">{order.customer.address}</p>
                        <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 bg-[#25D366] text-white text-sm font-bold py-1.5 px-3 rounded-full hover:bg-opacity-90">
                            <WhatsAppIcon className="w-4 h-4" />
                            Chat on WhatsApp
                        </a>
                    </div>

                    {/* Items List */}
                    <div>
                        <p className="text-sm font-medium text-neutral-400 px-1 mb-2">Items</p>
                        <div className="space-y-2">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center bg-[#2D2D2D] p-2.5 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-white">{t(item.name)}</p>
                                        <p className="text-sm text-neutral-400">{item.quantity} x {item.price}</p>
                                    </div>
                                    <p className="font-semibold text-neutral-200">₹{(item.quantity * parseFloat(item.price.replace('₹', ''))).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Total */}
                    <div className="flex justify-between items-center bg-[#2D2D2D] p-3 rounded-lg">
                        <div>
                            <p className="font-bold text-white text-lg">Total Bill</p>
                            <p className="text-sm text-neutral-400 font-semibold">Payment: {order.paymentMethod}</p>
                        </div>
                        <p className="font-bold text-2xl text-[#E6E6FA]">₹{order.total.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A] to-transparent">
             <ActionButtons />
        </div>

      </div>
    </>
  );
};

export default OrderDetailsModal;