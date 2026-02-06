import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QrCode, ArrowLeft, Download, CheckCircle } from 'lucide-react';

const Register = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({});
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Load the specific event structure (Fields)
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/events/list`);
        const currentEvent = res.data.find(e => e._id === eventId);
        setEvent(currentEvent);
        
        // Initialize form data with empty strings
        const initialData = {};
        currentEvent.fields.forEach(field => initialData[field] = '');
        setFormData(initialData);
      } catch (err) {
        console.error("Error fetching event details", err);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/attendees/register', {
        eventId,
        formData
      });
      setQrCode(res.data.qrCode);
      setLoading(false);
    } catch (err) {
      alert("Registration failed");
      setLoading(false);
    }
  };

  /**
   * BUG FIXED: Reset both the QR code and the form data
   */
  const handleRegisterAnother = () => {
    setQrCode('');
    const resetData = {};
    if (event && event.fields) {
      event.fields.forEach(field => resetData[field] = '');
    }
    setFormData(resetData);
  };

  if (!event) return <div className="p-10 text-center font-sans">Loading Event...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center font-sans">
      <button onClick={() => navigate('/generator')} className="mb-6 self-start flex items-center text-blue-600 font-medium hover:underline">
        <ArrowLeft size={20} className="mr-2" /> Back to Generator
      </button>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">{event.name}</h2>
        <p className="text-gray-500 text-center mb-8">Fill the details to generate your QR Code</p>

        {!qrCode ? (
          <form onSubmit={handleRegister} className="space-y-4">
            {event.fields.map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field}</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData[field] || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md active:scale-95 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Generate Unique QR Code"}
            </button>
          </form>
        ) : (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center mb-4">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-green-600 mb-4">Registration Successful!</h3>
            <div className="bg-white p-2 inline-block rounded-lg shadow-sm border border-gray-100 mb-6">
               <img src={qrCode} alt="User QR Code" className="w-64 h-64 mx-auto rounded-md" />
            </div>
            <div className="flex flex-col gap-3">
              <a 
                href={qrCode} 
                download={`${event.name}_QR.png`}
                className="flex items-center justify-center bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-black transition-all shadow-md"
              >
                <Download size={20} className="mr-2" /> Download QR
              </a>
              <button 
                onClick={handleRegisterAnother} 
                className="mt-2 text-sm text-blue-600 font-bold hover:underline"
              >
                Register another person
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-12 opacity-50">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">
          Powered by QR Master Protocol
        </p>
      </div>
    </div>
  );
};

export default Register;