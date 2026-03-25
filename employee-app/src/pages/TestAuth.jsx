import React, { useEffect } from 'react';

const TestAuth = () => {
  useEffect(() => {
    const employeeId = sessionStorage.getItem('mobile_employeeId');
    const employeeName = sessionStorage.getItem('mobile_employeeName');
    
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
      <p>employeeId: {sessionStorage.getItem('mobile_employeeId')}</p>
      <p>employeeName: {sessionStorage.getItem('mobile_employeeName')}</p>
    </div>
  );
};

export default TestAuth;
