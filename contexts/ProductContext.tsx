import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Product, Insight } from '../types';
import { initialProducts } from '../data/initialProducts';
import { generateDynamicInsights } from '../services/ai';
import { useLanguage } from './LanguageContext';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  loading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface InsightContextType {
  insights: Insight[];
  isLoadingInsights: boolean;
  error: string | null;
  refreshInsights: () => Promise<void>;
}

const InsightContext = createContext<InsightContextType | undefined>(undefined);


export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('dukan-products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(initialProducts);
      }
    } catch (error) {
      console.error("Failed to load products from localStorage", error);
      setProducts(initialProducts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
        try {
            localStorage.setItem('dukan-products', JSON.stringify(products));
        } catch (error) {
             if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                console.error("LocalStorage quota exceeded. Cannot save products.");
                alert("Error: Your device storage is full. Cannot save new product data. Please try removing some older products or images.");
            } else {
                console.error("Failed to save products to localStorage", error);
            }
        }
    }
  }, [products, loading]);

  const refreshInsights = useCallback(async () => {
    setIsLoadingInsights(true);
    setError(null);
    setInsights([]); // Clear previous insights for streaming

    try {
      for await (const insight of generateDynamicInsights(products, language)) {
        setInsights(prevInsights => [...prevInsights, insight]);
      }
    } catch (err) {
      const errorMessage = 'Failed to load insights due to a network or client error.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [products, language]);

  useEffect(() => {
    // This effect runs only when the initial product data has been loaded.
    // It is intentionally not dependent on `refreshInsights` (and by extension, `products`)
    // to prevent automatic refreshes when the product catalog changes.
    // Insights will now only refresh on initial load or when the user manually clicks the refresh button.
    if (!loading) {
      refreshInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: `prod_${new Date().getTime()}`,
    };
    setProducts(prevProducts => [...prevProducts, newProduct]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prevProducts =>
      prevProducts.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const deleteProduct = (productId: string) => {
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
  };
  
  const productContextValue = { products, addProduct, updateProduct, deleteProduct, loading };
  const insightContextValue = { insights, isLoadingInsights, error, refreshInsights };

  return (
    <ProductContext.Provider value={productContextValue}>
        <InsightContext.Provider value={insightContextValue}>
            {children}
        </InsightContext.Provider>
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const useInsights = () => {
    const context = useContext(InsightContext);
    if (context === undefined) {
        throw new Error('useInsights must be used within a ProductProvider');
    }
    return context;
};