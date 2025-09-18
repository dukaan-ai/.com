
import React, { useState, useCallback, useEffect, useRef } from 'react';
import DashboardScreen from './screens/DashboardScreen';
import BottomNav from './components/BottomNav';
import { Screen, Order, OrderStatus, Product, Customer } from './types';
import SalesScreen from './screens/SalesScreen';
import InsightsScreen from './screens/InsightsScreen';
import CatalogScreen from './screens/CatalogScreen';
import SettingsScreen from './screens/SettingsScreen';
import { ProductProvider, useProducts } from './contexts/ProductContext';
import { LanguageProvider } from './contexts/LanguageContext';
import OrdersScreen from './screens/OrdersScreen';
import { initialOrders } from './data/initialOrders';
import NewOrderModal from './components/NewOrderModal';
import { initialProducts } from './data/initialProducts';
import OnboardingFlow from './screens/OnboardingFlow';

// --- Mock Data for Realistic Simulation ---
const mockCustomers: Omit<Customer, 'whatsappNumber'>[] = [
    { name: 'Rohan Gupta', address: '15/2, Geeta Colony, Near Jheel Chowk, Delhi' },
    { name: 'Sneha Verma', address: 'House No. 24, Block D, Krishna Nagar, Delhi' },
    { name: 'Amit Singh', address: 'C-112, Laxmi Nagar, Vikas Marg, New Delhi' },
    { name: 'Priya Sharma', address: 'F-7, Main Market, Shahdara, Delhi' },
    { name: 'Vikram Choudhary', address: '48, Radhepuri, Near Gandhi Nagar, Delhi' },
    { name: 'Neha Patel', address: '8/B, Shastri Nagar, Near Geeta Colony, Delhi' },
    { name: 'Manish Kumar', address: '201, Ram Nagar, Shahdara, New Delhi' },
];

const AppContent: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.DASHBOARD);
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
        const storedOrders = localStorage.getItem('dukan-orders');
        if (storedOrders) {
            const parsed = JSON.parse(storedOrders);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }

        // Check if it's a new user (onboarding not complete).
        const isNewUser = localStorage.getItem('dukan-onboarding-complete') !== 'true';
        if (isNewUser) {
            return []; // New users start with zero orders.
        }
        
        // Fallback for existing users who might have cleared their orders but not onboarding status.
        return initialOrders;

    } catch (error) {
        console.error("Failed to load orders from localStorage", error);
        // Safe fallback in case of any error
        const isNewUser = localStorage.getItem('dukan-onboarding-complete') !== 'true';
        return isNewUser ? [] : initialOrders;
    }
  });
  const [newOrderForPopup, setNewOrderForPopup] = useState<Order | null>(null);
  const [isInteractionDone, setInteractionDone] = useState(false);
  const [isOtherModalShowing, setIsOtherModalShowing] = useState(false);
  const { products, updateProduct } = useProducts();
  const timeoutRef = useRef<number | null>(null);
  const isSimulatingRef = useRef(false); // To prevent multiple simulation timeouts
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
        const onboardingComplete = localStorage.getItem('dukan-onboarding-complete');
        if (onboardingComplete !== 'true') {
            setShowOnboarding(true);
        }
    } catch (error) {
        console.error("Failed to check onboarding status from localStorage", error);
        // Fallback to showing onboarding if localStorage is inaccessible
        setShowOnboarding(true);
    }
  }, []);

  // Persist orders to localStorage whenever they change
  useEffect(() => {
    try {
        localStorage.setItem('dukan-orders', JSON.stringify(orders));
    } catch (error)
        {
        console.error("Failed to save orders to localStorage", error);
    }
  }, [orders]);


  const handleFirstInteraction = useCallback(() => {
    if (isInteractionDone) return;
    console.log("First user interaction detected. Starting order simulation.");
    setInteractionDone(true);
  }, [isInteractionDone]);

  const newOrderCount = orders.filter(o => o.status === OrderStatus.NEW).length;

  const handleNavigation = useCallback((screen: Screen) => {
    setActiveScreen(screen);
  }, []);

  const handleModalStateChange = useCallback((isOpen: boolean) => {
    setIsOtherModalShowing(isOpen);
  }, []);

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    const orderToUpdate = orders.find(o => o.id === orderId);

    // If an order is accepted (moved from NEW to PREPARING), update inventory.
    if (orderToUpdate && orderToUpdate.status === OrderStatus.NEW && status === OrderStatus.PREPARING) {
        orderToUpdate.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const newStock = Math.max(0, product.stock - item.quantity);
                updateProduct({ ...product, stock: newStock });
            }
        });
    }

    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
    if (newOrderForPopup?.id === orderId) {
        setNewOrderForPopup(null);
    }
  };

  const generateRandomOrder = useCallback(() => {
    if (!isInteractionDone || products.length === 0) {
      return;
    }

    // Pick a random customer
    const randomCustomer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
    
    // Pick 1 to 3 random products
    const orderItems = [];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const availableProducts = [...products].filter(p => p.stock > 0);
    
    for (let i = 0; i < numItems && availableProducts.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableProducts.length);
        const product = availableProducts.splice(randomIndex, 1)[0];
        orderItems.push({
            productId: product.id,
            name: product.name,
            quantity: 1, // Keep quantity simple
            price: product.price,
        });
    }

    if (orderItems.length === 0) return;

    const total = orderItems.reduce((acc, item) => acc + parseFloat(item.price.replace('₹', '')) * item.quantity, 0);

    const newOrder: Order = {
      id: `B2C-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: { ...randomCustomer, whatsappNumber: '+919876543210' }, // Placeholder number
      items: orderItems,
      total: total,
      paymentMethod: Math.random() > 0.5 ? 'COD' : 'UPI',
      status: OrderStatus.NEW,
      timestamp: new Date().toISOString(),
    };
    
    setOrders(prevOrders => [newOrder, ...prevOrders]);

    if (activeScreen === Screen.SETTINGS || isOtherModalShowing) {
        console.log('New order generated, but popup suppressed due to active screen or another modal being open.');
        return;
    }
    
    setNewOrderForPopup(newOrder);
  }, [isInteractionDone, products, activeScreen, isOtherModalShowing, updateProduct]);
  
  const runOrderSimulation = useCallback(() => {
    if (!isInteractionDone || products.length === 0 || newOrderForPopup) {
      isSimulatingRef.current = false;
      return;
    }

    isSimulatingRef.current = true;
    const randomInterval = Math.floor(Math.random() * (40000 - 20000 + 1)) + 20000; // 20-40 seconds
    
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
        generateRandomOrder();
        isSimulatingRef.current = false; // Allow next simulation to be scheduled
    }, randomInterval);
  }, [isInteractionDone, products, newOrderForPopup, generateRandomOrder]);

  useEffect(() => {
    if (isInteractionDone && !isSimulatingRef.current) {
      runOrderSimulation();
    }
  }, [isInteractionDone, orders, runOrderSimulation, newOrderForPopup]);

  const renderScreen = () => {
    switch (activeScreen) {
      case Screen.DASHBOARD:
        return <DashboardScreen orders={orders} onModalStateChange={handleModalStateChange} />;
      case Screen.SALES:
        return <SalesScreen orders={orders} />;
      case Screen.ORDERS:
        return <OrdersScreen orders={orders} onUpdateStatus={handleUpdateStatus} onModalStateChange={handleModalStateChange} />;
      case Screen.CATALOG:
        return <CatalogScreen onModalStateChange={handleModalStateChange} />;
      case Screen.SETTINGS:
        return <SettingsScreen onModalStateChange={handleModalStateChange} />;
      default:
        return <DashboardScreen orders={orders} onModalStateChange={handleModalStateChange} />;
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="h-full bg-black text-white" onClick={handleFirstInteraction}>
      <>
        <main className="pb-[calc(4rem+env(safe-area-inset-bottom))] h-full overflow-y-auto hide-scrollbar">
          {renderScreen()}
        </main>
        <BottomNav activeScreen={activeScreen} onNavigate={handleNavigation} newOrderCount={newOrderCount} />
         {newOrderForPopup && (
          <NewOrderModal 
            isOpen={!!newOrderForPopup} 
            order={newOrderForPopup} 
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </>
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}
    </div>
  );
};


const App: React.FC = () => (
    <LanguageProvider>
      <ProductProvider>
          <AppContent />
      </ProductProvider>
    </LanguageProvider>
);

export default App;
