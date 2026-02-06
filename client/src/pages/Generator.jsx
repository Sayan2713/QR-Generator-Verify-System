import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, List, ArrowLeft, Save, Plus, X, Check, Trash2, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Generator = () => {
  const [view, setView] = useState('list'); // 'list' or 'new'
  const [oldRecords, setOldRecords] = useState([]);
  const [eventName, setEventName] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  
  // States for the inline "Other" input
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customFieldName, setCustomFieldName] = useState('');

  const navigate = useNavigate();

  // Predefined field options
  const fieldOptions = ["Name", "Phone Number", "Gmail", "Address", "Organization"];

  // Fetch Old Records from MongoDB
  const fetchEvents = async () => {
    try {
      const res = await axios.get('https://qr-generator-verify-system.onrender.com/api/events/list');
      setOldRecords(res.data);
    } catch (err) {
      console.error("Error fetching events", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [view]);

  // Toggle selection of predefined or custom fields
  const toggleField = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  /**
   * Delete Logic: Removes event from Database via the DELETE route
   */
  const handleDelete = async (e, id, name) => {
    e.stopPropagation(); // Prevent navigating to registration
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await axios.delete(`https://qr-generator-verify-system.onrender.com/api/events/${id}`);
        alert("Record deleted successfully.");
        fetchEvents(); // Refresh the list
      } catch (err) {
        alert("Failed to delete record. Please check server status.");
      }
    }
  };

  /**
   * Adds the custom field from the inline input to the selected fields list
   */
  const confirmCustomField = () => {
    const trimmedField = customFieldName.trim();
    if (trimmedField !== "") {
      if (!selectedFields.includes(trimmedField)) {
        setSelectedFields([...selectedFields, trimmedField]);
      }
      setCustomFieldName('');
      setIsAddingCustom(false);
    }
  };

  /**
   * Saves the new event and sheet configuration to the backend
   */
  const handleSaveEvent = async () => {
    if (!eventName || selectedFields.length === 0) {
      alert("Please enter an event name and select at least one input field.");
      return;
    }

    try {
      await axios.post('https://qr-generator-verify-system.onrender.com/api/events/create', {
        name: eventName,
        fields: selectedFields
      });
      alert("Event structure saved and Google Sheet tab created!");
      setView('list'); 
      setEventName('');
      setSelectedFields([]);
    } catch (err) {
      alert(err.response?.data?.message || "Error creating event");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      {/* Navigation Header */}
      <button onClick={() => navigate('/')} className="mb-6 flex items-center text-blue-600 font-bold hover:underline transition-all">
        <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        {view === 'list' ? (
          /* LIST VIEW: Show existing event records */
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black flex items-center tracking-tighter">
                <List className="mr-3 text-blue-600" size={32}/> OLD RECORDS
              </h2>
              <button 
                onClick={() => setView('new')}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center font-bold hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
              >
                <PlusCircle size={20} className="mr-2"/> New Record
              </button>
            </div>

            <div className="grid gap-5">
              {oldRecords.length > 0 ? oldRecords.map((event) => (
                <div 
                  key={event._id} 
                  className="group border border-gray-100 p-6 rounded-2xl flex justify-between items-center bg-white hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-default"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-800 mb-1">{event.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                       {event.fields.map(f => (
                         <span key={f} className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-400 uppercase tracking-wider">{f}</span>
                       ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => navigate(`/register/${event._id}`)}
                      className="bg-white border-2 border-blue-100 text-blue-600 px-5 py-2 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                    >
                      <QrCode size={18} /> Generate QR
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, event._id, event.name)}
                      className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Record"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No infrastructure records found</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* CREATE VIEW: Build a new QR generator */
          <div className="bg-white rounded-[40px] shadow-2xl p-10 animate-in fade-in slide-in-from-bottom-6 duration-500 border border-gray-50">
            <h2 className="text-3xl font-black mb-8 text-gray-800 tracking-tighter uppercase">Configure Generator</h2>
            
            <div className="mb-10">
              <label className="block text-gray-500 font-black mb-4 uppercase text-[10px] tracking-[0.3em] ml-2">Generator Unique Name</label>
              <input 
                type="text" 
                placeholder="e.g. Annual Sports Meet 2026"
                className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-lg"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>

            <div className="mb-10">
              <p className="text-gray-500 font-black mb-6 uppercase text-[10px] tracking-[0.3em] ml-2">Required Identity Fields</p>
              <div className="flex flex-wrap gap-3 items-center">
                {fieldOptions.map(field => (
                  <button 
                    key={field}
                    onClick={() => toggleField(field)}
                    className={`px-6 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${
                      selectedFields.includes(field) 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xl' 
                      : 'bg-white border-gray-100 text-gray-400 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {selectedFields.includes(field) ? '✓' : '+'} {field}
                  </button>
                ))}
                
                {/* Dynamically added "Other" fields */}
                {selectedFields.filter(f => !fieldOptions.includes(f)).map(field => (
                  <button 
                    key={field}
                    onClick={() => toggleField(field)}
                    className="px-6 py-3 rounded-2xl border-2 bg-blue-600 border-blue-600 text-white shadow-xl transition-all font-bold text-sm"
                  >
                    ✓ {field}
                  </button>
                ))}

                {/* Inline "Other" Input toggle */}
                {isAddingCustom ? (
                  <div className="flex items-center gap-2 animate-in zoom-in duration-200">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Input Name..."
                      className="border-2 border-blue-500 px-5 py-3 rounded-2xl outline-none font-bold text-sm w-48 shadow-inner"
                      value={customFieldName}
                      onChange={(e) => setCustomFieldName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmCustomField();
                        if (e.key === 'Escape') setIsAddingCustom(false);
                      }}
                    />
                    <button 
                      onClick={confirmCustomField}
                      className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => {
                        setIsAddingCustom(false);
                        setCustomFieldName('');
                      }}
                      className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAddingCustom(true)}
                    className="px-6 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-blue-500 font-bold hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center gap-2"
                  >
                    <Plus size={18} /> Other
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-6 border-t border-gray-100 pt-8 mt-12">
              <button 
                onClick={() => {
                  setView('list');
                  setSelectedFields([]);
                  setEventName('');
                  setIsAddingCustom(false);
                }} 
                className="px-8 py-3 text-gray-400 font-bold hover:text-red-500 transition-colors uppercase text-xs tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEvent}
                className="bg-emerald-500 text-white px-10 py-4 rounded-3xl flex items-center font-black text-sm uppercase tracking-widest hover:bg-emerald-600 shadow-xl active:scale-95 transition-all"
              >
                <Save size={20} className="mr-3"/> Deploy Module
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Generator;