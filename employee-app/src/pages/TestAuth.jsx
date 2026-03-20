import React, { useEffect } from 'react';

const TestAuth = () => {
  useEffect(() => {
    const employeeId = localStorage.getItem('employeeId');
    const employeeName = localStorage.getItem('employeeName');
    
    console.log('TestAuth: employeeId =', employeeId);
    console.log('TestAuth: employeeName =', employeeName);
    
    // Forzar autenticación para pruebas
    if (!employeeId) {
      localStorage.setItem('employeeId', 'EMP001');
      localStorage.setItem('employeeName', 'Empleado Demo');
      console.log('TestAuth: Autenticación forzada');
    }
  }, []);

  return (
    <div>
      <h1>Test de Autenticación</h1>
      <p>employeeId: {localStorage.getItem('employeeId')}</p>
      <p>employeeName: {localStorage.getItem('employeeName')}</p>
    </div>
  );
};

export default TestAuth;
