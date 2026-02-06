import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, UserX, LogIn, LogOut, Coffee, ArrowLeft, CheckCircle, RefreshCw, Plus, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Note: We use dynamic script injection for html5-qrcode to prevent compilation errors 
 * in the browser environment. Locally, ensure you have run: npm install html5-qrcode
 */

const Verify = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScammer, setIsScammer] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [events, setEvents] = useState([]);
  const [customAction, setCustomAction] = useState("");
  const [actionLog, setActionLog] = useState([]); // Tracks sequence of updates for this user
  const navigate = useNavigate();

  // Load event names for the admin to select
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/events/list');
        setEvents(res.data);
      } catch (err) {
        console.error("Error fetching events", err);
      }
    };
    fetchEvents();
  }, []);

  // Inject Scanner Script if not present
  useEffect(() => {
    if (!window.Html5QrcodeScanner) {
      const script = document.createElement('script');
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Scanner Initialization Logic
  useEffect(() => {
    let scanner = null;
    
    if (selectedEvent && !scanResult && !isScammer) {
      const initScanner = () => {
        if (window.Html5QrcodeScanner) {
          try {
            scanner = new window.Html5QrcodeScanner("reader", {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            });

            scanner.render((decodedText) => {
              scanner.clear().then(() => {
                handleVerification(decodedText);
              }).catch(() => handleVerification(decodedText));
            }, () => {});
          } catch (e) {
            console.error("Scanner init error", e);
          }
        }
      };

      const timer = setTimeout(initScanner, 300);
      
      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(e => console.warn("Cleanup warning", e));
        }
      };
    }
  }, [selectedEvent, scanResult, isScammer]);

  /**
   * handleVerification:
   * Sends the initial scan to the backend. We explicitly store the qrId
   * in the state to ensure subsequent updates (Status2, Status3) work.
   */
  const handleVerification = async (qrId) => {
    try {
      const res = await axios.post('http://localhost:5000/api/verify/scan', {
        qrCodeId: qrId,
        eventName: selectedEvent,
        action: 'Verified By Admin'
      });
      
      // We combine the response data with the original qrId to prevent "Missing Data" errors later
      setScanResult({ ...res.data, qrCodeId: qrId });
      setActionLog(['Verified']);
      setIsScammer(false);
    } catch (err) {
      setIsScammer(true);
      setScanResult(err.response?.data || { message: "QR Code not authorized for this event." });
    }
  };

  /**
   * handleAction:
   * Triggers the Excel update. If your backend is set up for sequential status,
   * clicking this multiple times will create Status, Status2, etc.
   */
  const handleAction = async (actionType) => {
    const finalAction = actionType === 'CUSTOM' ? customAction : actionType;
    
    if (actionType === 'CUSTOM' && !customAction.trim()) {
      alert("Please enter a status name in the input box.");
      return;
    }

    // Retrieve the ID from our preserved state
    const qrId = scanResult?.qrCodeId || scanResult?.attendee?.qrCodeId;

    if (!qrId || !selectedEvent) {
      alert("Data Error: The ID or Event name is missing. Please reset and scan again.");
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/verify/scan', {
        qrCodeId: qrId,
        eventName: selectedEvent,
        action: finalAction
      });
      
      // Update the local log so you can see the sequence on screen
      setActionLog(prev => [...prev, finalAction]);
      setCustomAction("");
      
      // Success visual feedback
      console.log("Excel Updated:", finalAction);
    } catch (err) {
      console.error("Update Error:", err);
      // Detailed error alert to help debug backend connection
      const errorMsg = err.response?.data?.message || "Check your backend server and Google Sheets connection.";
      alert(`Action failed to update: ${errorMsg}`);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setIsScammer(false);
    setCustomAction("");
    setActionLog([]);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-6 flex flex-col items-center font-sans text-gray-800">
      <button 
        onClick={() => navigate('/')} 
        className="mb-8 self-start flex items-center text-blue-600 font-bold hover:underline bg-white px-5 py-2.5 rounded-2xl shadow-sm transition-all active:scale-95"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to Home
      </button>

      <div className="w-full max-w-lg bg-white rounded-[3.5rem] shadow-[25px_25px_60px_#d1d1d1,-25px_-25px_60px_#ffffff] p-12 border border-white">
        <h2 className="text-3xl font-black mb-10 flex items-center tracking-tighter uppercase">
          <ShieldCheck className="mr-3 text-emerald-600" size={40} /> Verification
        </h2>

        {!selectedEvent ? (
          <div className="space-y-8">
            <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 shadow-inner">
               <p className="text-blue-700 text-sm font-black uppercase tracking-widest text-center">Authorization Required</p>
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">Select Active Sheet</label>
              <select 
                className="w-full border-none bg-gray-50 p-6 rounded-[2rem] outline-none focus:ring-4 ring-blue-500/10 transition-all font-black text-gray-700 appearance-none shadow-inner cursor-pointer text-lg"
                onChange={(e) => setSelectedEvent(e.target.value)}
                value={selectedEvent}
              >
                <option value="">-- CHOOSE EVENT --</option>
                {events.map(ev => <option key={ev._id} value={ev.name}>{ev.name}</option>)}
              </select>
            </div>
          </div>
        ) : !scanResult && !isScammer ? (
          <div className="animate-in fade-in duration-500">
            <p className="text-center text-gray-400 font-black uppercase tracking-[0.3em] mb-8 text-[10px]">
              Ready for scan: <span className="text-blue-600">{selectedEvent}</span>
            </p>
            <div id="reader" className="overflow-hidden rounded-[3rem] border-[10px] border-white shadow-2xl bg-gray-900 min-h-[320px]"></div>
            <button 
              onClick={() => setSelectedEvent('')} 
              className="mt-12 text-gray-400 hover:text-red-500 w-full text-center text-[10px] font-black uppercase tracking-[0.4em] transition-colors"
            >
              Cancel & Switch Event
            </button>
          </div>
        ) : isScammer ? (
          <div className="text-center p-10 bg-red-50 rounded-[3rem] border-2 border-red-100 shadow-xl animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
               <UserX size={56} className="text-red-500" />
            </div>
            <h3 className="text-4xl font-black text-red-700 mb-4 uppercase tracking-tighter leading-none">Scammer</h3>
            <p className="text-red-600 font-bold italic mb-12 opacity-90 leading-relaxed text-sm">
              {scanResult?.message || "Identity not found in the encrypted records for this event."}
            </p>
            <button 
              onClick={handleReset} 
              className="w-full bg-red-600 text-white font-black py-6 rounded-[2rem] hover:bg-red-700 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs"
            >
              Reset Protocol
            </button>
          </div>
        ) : (
          <div className="space-y-10 animate-in zoom-in duration-500">
            {/* Authenticated User Banner */}
            <div className="text-center p-10 bg-white rounded-[3rem] shadow-[inset_12px_12px_24px_#e2e8f0,inset_-12px_-12px_24px_#ffffff] border border-white">
               <CheckCircle size={72} className="text-emerald-500 mx-auto mb-6" />
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mb-2">Authenticated User</p>
               <h3 className="text-4xl font-black tracking-tighter leading-none">{scanResult.userName || "Attendee"}</h3>
            </div>

            {/* Quick Status Actions */}
            <div className="grid grid-cols-2 gap-5">
              <button onClick={() => handleAction('Enter To Event')} className="flex flex-col items-center p-7 bg-blue-50 rounded-[2.5rem] hover:bg-blue-100 transition-all border border-blue-100 group active:scale-95 shadow-sm">
                <LogIn className="text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Enter</span>
              </button>
              <button onClick={() => handleAction('Exit From Event')} className="flex flex-col items-center p-7 bg-orange-50 rounded-[2.5rem] hover:bg-orange-100 transition-all border border-orange-100 group active:scale-95 shadow-sm">
                <LogOut className="text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Exit</span>
              </button>
              <button onClick={() => handleAction('Break From Event')} className="flex flex-col items-center p-7 bg-purple-50 rounded-[2.5rem] hover:bg-purple-100 transition-all border border-purple-100 group active:scale-95 shadow-sm">
                <Coffee className="text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Break</span>
              </button>
              <button onClick={handleReset} className="flex flex-col items-center p-7 bg-emerald-600 text-white rounded-[2.5rem] hover:bg-emerald-700 transition-all border border-emerald-500 group active:scale-95 shadow-lg">
                <ShieldCheck className="mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Next Scan</span>
              </button>
            </div>

            {/* Status History Display */}
            {actionLog.length > 0 && (
              <div className="p-7 bg-gray-50 rounded-[2rem] shadow-inner border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-5 flex items-center gap-2">
                  <History size={14} /> Excel Update Log
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {actionLog.map((log, idx) => (
                    <span key={idx} className="bg-white border border-gray-200 px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-600 shadow-sm animate-in fade-in slide-in-from-left-3">
                      {idx === 0 ? "Verified" : `Step ${idx}`}: {log}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Manual New Field Input */}
            <div className="pt-10 border-t-2 border-gray-100">
               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-6 mb-5">Manual Append (New Excel Col)</label>
               <div className="flex gap-5">
                  <input 
                    className="flex-1 bg-gray-50 shadow-inner p-6 rounded-[2rem] outline-none font-bold text-gray-800 border-none focus:ring-4 ring-emerald-500/10 text-base placeholder:text-gray-300 transition-all"
                    placeholder="e.g. Lunch, Kit, Prize..."
                    value={customAction}
                    onChange={(e) => setCustomAction(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAction('CUSTOM')}
                  />
                  <button 
                    onClick={() => handleAction('CUSTOM')}
                    className="bg-emerald-500 text-white p-6 rounded-[1.5rem] shadow-xl hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center"
                  >
                    <Plus size={28} strokeWidth={3} />
                  </button>
               </div>
               <p className="text-[10px] text-gray-400 mt-4 ml-6 italic font-medium">Click + to add a unique status column for this user in Excel.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-20 opacity-30 select-none text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.7em] text-gray-400">Helping Hand</p>
      </div>
    </div>
  );
};

export default Verify;