import { useState, useEffect } from 'react';
import employeeService from '../services/employeeService';

export const useEmployee = (employeeId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (employeeId) {
      loadProfile();
    }
  }, [employeeId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getProfile(employeeId);
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err);
      // Cargar datos de demo si hay error
      setProfile({
        id: employeeId,
        name: 'Empleado Demo',
        role: 'Cajero Principal',
        sucursal: 'Tulipanes',
        turno: 'Matutino',
        avatar: null,
        email: 'empleado@demo.com',
        phone: '555-123-4567'
      });
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, reload: loadProfile };
};

export default useEmployee;
