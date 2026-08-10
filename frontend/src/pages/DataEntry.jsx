import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import api from '../axios';
import { useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import MonthFilter from '../components/ui/MonthFilter';

export default function DataEntry({ user }) {
  const { dept, div } = useParams();
  
  // Basic periods for the dropdown since MonthFilter might be complex for this
  const periods = ['Agustus 2026', 'Juli 2026', 'Juni 2026'];
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);
  
  const [fields, setFields] = useState([
    { key: '', value: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const addField = () => {
    setFields([...fields, { key: '', value: '' }]);
  };

  const removeField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields.length ? newFields : [{ key: '', value: '' }]);
  };

  const handleFieldChange = (index, field, val) => {
    const newFields = [...fields];
    newFields[index][field] = val;
    setFields(newFields);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    // Construct payload object from key-value pairs
    const payloadData = {};
    let hasValidData = false;
    
    fields.forEach(f => {
      if (f.key.trim()) {
        payloadData[f.key.trim()] = f.value;
        hasValidData = true;
      }
    });

    if (!hasValidData) {
      setMessage({ type: 'error', text: 'Please add at least one valid data entry.' });
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/data-entries', {
        department_id: user?.department?.id, // Use the user's assigned division
        period: selectedPeriod,
        payload: payloadData
      });
      setMessage({ type: 'success', text: 'Data successfully saved!' });
      setFields([{ key: '', value: '' }]); // Reset form
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save data.' });
    } finally {
      setLoading(false);
    }
  };

  // Human readable title
  const title = (div || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-boxdark">Update Data - {title}</h2>
          <p className="text-sm text-body mt-1">Input KPI metrics and dynamic data for this period.</p>
        </div>
      </div>

      <Card>
        <div className="p-6">
          {message.text && (
            <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6 max-w-sm">
              <label className="mb-2 block text-sm font-medium text-boxdark">Period</label>
              <select 
                value={selectedPeriod} 
                onChange={e => setSelectedPeriod(e.target.value)}
                className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-3 outline-none focus:border-primary focus:bg-white transition-colors"
              >
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-boxdark">Data Entries</label>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Metric Name (e.g. Total Revenue)" 
                        value={field.key}
                        onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                        className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-3 outline-none focus:border-primary focus:bg-white transition-colors text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Value (e.g. $1,250k)" 
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                        className="w-full rounded-md border border-stroke bg-gray-50 py-2.5 px-3 outline-none focus:border-primary focus:bg-white transition-colors text-sm"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeField(index)}
                      className="p-2 text-danger hover:bg-danger/10 rounded-md transition-colors flex-shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <button 
                type="button" 
                onClick={addField}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={16} /> Add Another Metric
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-stroke">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-medium rounded-md hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                <Save size={18} /> {loading ? 'Saving...' : 'Save Data'}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
