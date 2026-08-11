import { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../axios';
import Modal from '../components/ui/Modal';

export default function UserManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    email: '',
    password: '',
    role: 'Division PIC',
    division_id: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, divRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/divisions')
      ]);
      setUsers(usersRes.data);
      setDivisions(divRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', email: '', password: '', role: 'Division PIC', department_id: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setModalMode('edit');
    setFormData({
      id: u.id,
      name: u.name,
      email: u.email,
      password: '',
      role: u.roles && u.roles.length > 0 ? u.roles[0].name : 'Division PIC',
      department_id: u.department_id || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (modalMode === 'add') {
        await api.post('/api/users', formData);
      } else {
        await api.put(`/api/users/${formData.id}`, formData);
      }
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (err) {
      setFormError(err.response?.data?.message || 'An error occurred.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/api/users/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user.');
      }
    }
  };

  return (
    <>
      <div className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-3">
          <div>
          <h2 className="text-2xl font-bold text-boxdark">User Management</h2>
          <p className="text-sm text-body mt-1">Manage system users, roles, and division assignments.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition">
          <Plus size={18} />
          <span>Add New User</span>
        </button>
      </div>

      <div className="bg-white rounded-sm border border-stroke shadow-default">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left bg-gray-100">
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black">Name</th>
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black">Email</th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black">Role</th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black">Division</th>
                  <th className="py-4 px-4 font-medium text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u.id}>
                    <td className="border-b border-[#eee] py-5 px-4">
                      <p className="text-black font-medium">{u.name}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4">
                      <p className="text-black">{u.email}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4">
                      <span className={`inline-flex rounded-full py-1 px-3 text-sm font-medium ${
                        u.roles?.[0]?.name === 'Admin' ? 'bg-danger/10 text-danger' : 
                        u.roles?.[0]?.name === 'Top Management' ? 'bg-warning/10 text-warning' : 
                        'bg-primary/10 text-primary'
                      }`}>
                        {u.roles && u.roles.length > 0 ? u.roles[0].name : 'No Role'}
                      </span>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4">
                      <p className="text-black">{u.department?.name || '-'}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4">
                      <div className="flex items-center space-x-3.5">
                        <button onClick={() => openEditModal(u)} className="hover:text-primary">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="hover:text-danger text-gray-500">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* CRUD Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Add New User' : 'Edit User'}
        maxWidth="max-w-md"
      >
        {formError && <div className="mb-4 text-sm text-danger bg-danger/10 p-3 rounded-md border border-danger/20">{formError}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-boxdark">Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-3 outline-none focus:border-primary focus:bg-white transition-colors" />
          </div>
          
          <div>
            <label className="mb-1.5 block text-sm font-medium text-boxdark">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-3 outline-none focus:border-primary focus:bg-white transition-colors" />
          </div>
          
          <div>
            <label className="mb-1.5 block text-sm font-medium text-boxdark">{modalMode === 'add' ? 'Password' : 'New Password (leave blank to keep current)'}</label>
            <input required={modalMode === 'add'} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-3 outline-none focus:border-primary focus:bg-white transition-colors" />
          </div>
          
          <div>
            <label className="mb-1.5 block text-sm font-medium text-boxdark">Role</label>
            <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-3 outline-none focus:border-primary focus:bg-white transition-colors">
              <option value="Admin">Admin</option>
              <option value="Division PIC">Division PIC</option>
              <option value="Top Management">Top Management</option>
            </select>
          </div>

          {formData.role === 'Division PIC' && (
            <div className="animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
              <label className="mb-1.5 block text-sm font-medium text-boxdark">Assign Division</label>
              <select required={formData.role === 'Division PIC'} value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-3 outline-none focus:border-primary focus:bg-white transition-colors">
                <option value="">-- Select Division --</option>
                {divisions.map(div => (
                  <option key={div.id} value={div.id}>{div.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-stroke">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-medium border border-stroke text-gray-600 rounded-md hover:bg-gray-100 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-opacity-90 shadow-sm transition-all">{modalMode === 'add' ? 'Create User' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
