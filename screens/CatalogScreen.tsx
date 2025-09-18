import React, { useState, useRef, useEffect } from 'react';
import { useProducts } from '../contexts/ProductContext';
import { Product } from '../types';
import ProductModal from '../components/ProductModal';
import { useLanguage } from '../contexts/LanguageContext';

const CatalogHeader: React.FC = () => {
    const { t } = useLanguage();
    return (
        <header className="flex items-center bg-gradient-to-b from-[#1A1A1A] to-black p-4 pb-2 justify-center sticky top-0 z-10">
            <h1 className="text-white text-xl font-bold tracking-tight">{t('catalog_title')}</h1>
        </header>
    );
};

const SearchAndAdd: React.FC<{ onAdd: () => void, onSearch: (query: string) => void }> = ({ onAdd, onSearch }) => (
    <div className="flex items-center gap-2">
        <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">search</span>
            <input 
              type="text" 
              placeholder="Search products..." 
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white rounded-full pl-10 pr-4 py-2.5 border border-[#2D2D2D] focus:ring-2 focus:ring-[#E6E6FA] focus:outline-none"
            />
        </div>
        <button onClick={onAdd} className="flex-shrink-0 flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#E6E6FA] text-black">
            <span className="material-symbols-outlined text-2xl">add</span>
        </button>
    </div>
);

const ProductListItem: React.FC<{product: Product; onEdit: () => void;}> = ({product, onEdit}) => {
    const { name, price, stock, stockUnit, imageUrl } = product;
    const { t } = useLanguage();
    const isLowStock = stock < 10;
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { deleteProduct } = useProducts();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDelete = () => {
        // Close the menu first to avoid state updates on an unmounted component.
        setMenuOpen(false);
        
        // Defer the confirmation dialog to avoid potential race conditions with rendering.
        setTimeout(() => {
            if (window.confirm('Are you sure you want to delete this product?')) {
                deleteProduct(product.id);
            }
        }, 0);
    };

    return (
        <div className="flex items-center gap-4 p-3 bg-[#1A1A1A] rounded-xl">
            <img src={imageUrl} alt={name} className="h-16 w-16 rounded-lg object-cover bg-neutral-700"/>
            <div className="flex-1">
                <p className="font-bold text-white">{t(name)}</p>
                <p className="text-sm text-neutral-300">{price}</p>
                <p className={`text-xs font-semibold ${isLowStock ? 'text-red-400' : 'text-blue-300'}`}>
                    {stock} {stockUnit} in stock
                </p>
            </div>
            <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="text-neutral-400 p-2 rounded-full hover:bg-[#2D2D2D]">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
                {menuOpen && (
                    <div className="absolute right-0 top-10 mt-1 w-36 bg-[#2D2D2D] rounded-lg shadow-xl z-20 overflow-hidden">
                        <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-600 flex items-center gap-2">
                             <span className="material-symbols-outlined text-base">edit</span> Edit
                        </button>
                        <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-neutral-600 flex items-center gap-2">
                             <span className="material-symbols-outlined text-base">delete</span> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface CatalogScreenProps {
  onModalStateChange: (isOpen: boolean) => void;
}

const CatalogScreen: React.FC<CatalogScreenProps> = ({ onModalStateChange }) => {
  const { products, loading } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    onModalStateChange(isModalOpen);
  }, [isModalOpen, onModalStateChange]);

  const handleAddProduct = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };
  
  const filteredProducts = products.filter(p => 
    t(p.name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <CatalogHeader />
      <div className="p-4 space-y-6">
        <SearchAndAdd onAdd={handleAddProduct} onSearch={setSearchQuery} />
        {loading ? (
             <div className="text-center py-10 text-neutral-400">Loading products...</div>
        ) : (
            <div className="space-y-3">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <ProductListItem 
                            key={product.id} 
                            product={product}
                            onEdit={() => handleEditProduct(product)}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 text-neutral-400">
                        <p className="font-semibold">No products found.</p>
                        <p className="text-sm">Try adjusting your search or add a new product.</p>
                    </div>
                )}
            </div>
        )}
      </div>
      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} productToEdit={productToEdit} />
    </div>
  );
};

export default CatalogScreen;