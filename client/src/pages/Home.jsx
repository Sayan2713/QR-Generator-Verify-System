import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ShieldCheck, LayoutDashboard, MoveRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const Card = ({ title, subtitle, icon: Icon, path, glowColor, textColor }) => (
    <div 
      onClick={() => navigate(path)}
      className={`group relative flex flex-col items-center justify-center p-10 bg-white/80 backdrop-blur-md rounded-[40px] border-2 border-transparent transition-all duration-500 cursor-pointer w-full hover:scale-105 shadow-xl shadow-gray-200/50`}
      style={{
        // Custom inline style to handle the specific glowing border from the image
        borderImage: `linear-gradient(to bottom, ${glowColor}, transparent) 1`,
      }}
    >
      {/* Icon with soft background glow */}
      <div className={`p-6 rounded-3xl mb-6 transition-all duration-300 group-hover:bg-gray-50 shadow-inner`}>
        <Icon size={48} className={`${textColor} opacity-80 group-hover:opacity-100`} />
      </div>

      <h2 className="text-2xl font-black text-gray-800 tracking-tighter mb-2 uppercase">{title}</h2>
      <p className="text-gray-400 text-sm font-medium mb-8">{subtitle}</p>

      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${textColor} opacity-60 group-hover:opacity-100 transition-all`}>
        Launch <MoveRight size={14} />
      </div>
      
      {/* The bottom "glow" line effect from the image */}
      <div className={`absolute bottom-0 w-1/2 h-1 rounded-full blur-sm ${glowColor} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8faff] flex flex-col items-center justify-center p-6 font-sans">
      {/* Background soft gradients to match the image */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-100/40 blur-[120px] rounded-full"></div>
      </div>

      <header className="relative z-10 text-center mb-16">
        <h1 className="text-7xl font-black text-gray-900 tracking-tighter drop-shadow-sm mb-2">
          QR MASTER
        </h1>
        <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-purple-400"></div>
            <p className="text-purple-500 font-bold tracking-[0.3em] text-xs uppercase">
                Provided By Helping Hand
            </p>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-purple-400"></div>
        </div>
        
        {/* The specific slogan placement you asked for */}
        <p className="mt-8 text-gray-400 font-medium text-lg">
            Manage your QR ecosystem <span className="text-gray-800 font-bold">seamlessly.</span>
        </p>
      </header>
      
      {/* Grid: 1 col on mobile, 3 on desktop to match the image */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl">
        <Card 
          title="QR Generator" 
          subtitle="Create custom QR codes"
          icon={QrCode} 
          path="/generator" 
          glowColor="#3b82f6" 
          textColor="text-blue-500"
        />
        <Card 
          title="Verify QR Code" 
          subtitle="Authenticate & validate"
          icon={ShieldCheck} 
          path="/verify" 
          glowColor="#10b981" 
          textColor="text-emerald-500"
        />
        <Card 
          title="Live Analytics" 
          subtitle="Real-time insights"
          icon={LayoutDashboard} 
          path="/dashboard" 
          glowColor="#a855f7" 
          textColor="text-purple-500"
        />
      </div>

      <footer className="relative z-10 mt-16 text-gray-300 text-xs font-bold tracking-widest uppercase">
        Powered by Sayan_2713
      </footer>
    </div>
  );
};

export default Home;