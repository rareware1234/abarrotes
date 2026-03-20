import { useState, useCallback } from 'react';
import productService from '../services/productService';

export const useScanner = () => {
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const scanBarcode = useCallback(async (barcode) => {
    if (!barcode) return;

    setIsScanning(true);
    setScanError(null);
    setScannedProduct(null);

    try {
      const product = await productService.scanProduct(barcode);
      setScannedProduct(product);
      return product;
    } catch (error) {
      setScanError('Producto no encontrado');
      // En producción, manejar el error adecuadamente
      console.error('Error escaneando:', error);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const resetScanner = useCallback(() => {
    setScannedProduct(null);
    setScanError(null);
    setIsScanning(false);
  }, []);

  return {
    scannedProduct,
    scanError,
    isScanning,
    scanBarcode,
    resetScanner
  };
};

export default useScanner;
