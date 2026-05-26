import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeCode: '',
    password: '',
    fullName: '',
    email: '',
    role: 'CAJERO'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      // En producción, esto vendría de auth-service
      // Por ahora, usaremos datos de ejemplo
      const mockEmployees = [
        { id: 1, employeeCode: 'EMP001', fullName: 'Juan Perez', email: 'juan@example.com', role: 'ADMIN', active: true },
        { id: 2, employeeCode: 'EMP002', fullName: 'Maria Garcia', email: 'maria@example.com', role: 'CAJERO', active: true },
      ];
      setEmployees(mockEmployees);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // En producción, esto se enviaría al auth-service
      console.log("Registrando empleado:", formData);
      
      // Simular registro exitoso
      const newEmployee = {
        id: employees.length + 1,
        ...formData,
        active: true
      };
      setEmployees([...employees, newEmployee]);
      setShowModal(false);
      setFormData({ employeeCode: '', password: '', fullName: '', email: '', role: 'CAJERO' });
    } catch (error) {
      console.error("Error al registrar empleado:", error);
    }
  };

  if (loading) return <div className="p-4">Cargando empleados...</div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Empleados</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg"></i> Nuevo Empleado
        </button>
      </div>

      {/* Tabla de empleados */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light text-primary">
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td><span className="badge bg-secondary">{emp.employeeCode}</span></td>
                  <td>{emp.fullName}</td>
                  <td>{emp.email}</td>
                  <td>{emp.role}</td>
                  <td className="text-center">
                    {emp.active ? (
                      <span className="badge bg-success">Activo</span>
                    ) : (
                      <span className="badge bg-danger">Inactivo</span>
                    )}
                  </td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-primary me-1">Editar</button>
                    <button className="btn btn-sm btn-outline-danger">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Nuevo Empleado */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Nuevo Empleado</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Código de Empleado</label>
                    <input type="text" className="form-control" name="employeeCode" value={formData.employeeCode} onChange={handleInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contraseña</label>
                    <input type="password" className="form-control" name="password" value={formData.password} onChange={handleInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nombre Completo</label>
                    <input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" name="email" value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rol</label>
                    <select className="form-select" name="role" value={formData.role} onChange={handleInputChange}>
                      <option value="CAJERO">Cajero</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="GERENTE">Gerente</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
