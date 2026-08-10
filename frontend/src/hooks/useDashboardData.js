import { useState, useEffect } from 'react';
import api from '../axios';

export function useDashboardData(departmentId, period) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!departmentId || !period) return;
    
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/data-entries`, {
          params: { department_id: departmentId, period }
        });
        if (isMounted) {
          setData(response.data || {});
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        if (isMounted) setData({});
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [departmentId, period]);

  const updateData = async (key, value) => {
    // Optimistic update
    const newData = { ...data, [key]: value };
    setData(newData);
    
    try {
      await api.post('/api/data-entries', {
        department_id: departmentId,
        period,
        payload: newData
      });
    } catch (err) {
      console.error("Failed to save dashboard data:", err);
      // Rollback could be implemented here
    }
  };

  return { data, updateData, loading };
}
