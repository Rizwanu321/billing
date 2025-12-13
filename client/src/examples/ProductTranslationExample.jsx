// EXAMPLE: How to use Auto-Translation for Products Page

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAutoTranslateList, T, useAutoText } from '../../i18n/TranslateAll';
import api from '../../utils/api';

const ProductsPageExample = () => {
    const { t } = useTranslation(); // For UI labels
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const response = await api.get('/products');
        setProducts(response.data);
    };

    // METHOD 1: Automatic translation of product list
    const { translatedItems: translatedProducts, loading } = useAutoTranslateList(
        products,
        ['name', 'description'] // Keys to translate
    );

    return (
        <div className="p-6">
            {/* UI Labels - Use t() from translation files */}
            <h1 className="text-2xl font-bold">{t('product.title')}</h1>

            {/* Dynamic heading - Use T component or useAutoText */}
            <h2 className="text-lg"><T>Product List</T></h2>

            {loading && <div>Translating...</div>}

            <div className="grid grid-cols-3 gap-4">
                {translatedProducts.map(product => (
                    <div key={product._id} className="border p-4 rounded">
                        {/* Product names are automatically translated */}
                        <h3 className="font-bold">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.description}</p>

                        {/* UI labels use translation keys */}
                        <div className="mt-2">
                            <span className="text-gray-500">{t('product.price')}: </span>
                            <span className="font-bold">₹{product.price}</span>
                        </div>

                        <div>
                            <span className="text-gray-500">{t('product.stock')}: </span>
                            <span>{product.stock}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// METHOD 2: Using translateAll HOC for entire component
// This automatically translates ALL text in the component
import { translateAll } from '../../i18n/TranslateAll';

const SimpleProductCard = ({ product }) => {
    return (
        <div className="border p-4">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <button>Add to Cart</button> {/* This will be auto-translated */}
        </div>
    );
};

// Wrap with translateAll HOC
export default translateAll(SimpleProductCard);

// METHOD 3: Individual text translation hook
const ProductName = ({ name }) => {
    const translatedName = useAutoText(name);
    return <h2>{translatedName}</h2>;
};

// METHOD 4: Inline translation component
const ProductDescription = ({ description }) => {
    return (
        <p>
            <T>{description}</T>
        </p>
    );
};

export { ProductsPageExample, SimpleProductCard, ProductName, ProductDescription };
