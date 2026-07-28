"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, CreditCard, Bell, LogOut, Camera, HardDrive, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type TabType = 'profile' | 'security' | 'billing' | 'notifications';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] pb-24 relative overflow-hidden font-sans">
      
      {/* Background Soft Pink Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FCFAEE] via-[#FDF5F2] to-[#F5EFEA] -z-10" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#14241B]">Settings</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-56 flex-shrink-0">
            <div className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center w-full px-4 py-3 rounded-full transition-all duration-200 text-sm font-semibold ${
                    activeTab === tab.id 
                      ? "bg-white text-[#14241B] shadow-sm border border-gray-100" 
                      : "text-gray-500 hover:bg-white/50 hover:text-[#14241B] border border-transparent"
                  }`}
                >
                  {tab.icon}
                  <span className="ml-3">{tab.label}</span>
                </button>
              ))}
              
              <div className="h-px bg-gray-200 my-4 mx-4" />
              
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-full text-[#D33B31] hover:bg-red-50 transition-all duration-200 border border-transparent text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="ml-3">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-gray-100">
                    <h2 className="text-2xl font-bold mb-8 text-[#14241B]">Account Profile</h2>
                    
                    <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border border-gray-100 shadow-sm relative group">
                          {user?.profile_picture ? (
                            <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-4xl font-bold text-gray-400">
                              {user?.full_name?.charAt(0).toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <span className="text-white text-xs font-bold">Change</span>
                          </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#14241B] rounded-full flex items-center justify-center shadow-md cursor-pointer border-2 border-white">
                           <Camera className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Inputs */}
                      <div className="flex-1 space-y-6 w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Full Name</label>
                            <input 
                              type="text" 
                              defaultValue={user?.full_name}
                              className="w-full bg-transparent border border-gray-200 text-[#14241B] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#14241B] transition-all font-medium text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Email Address</label>
                            <input 
                              type="email" 
                              defaultValue={user?.email}
                              disabled
                              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-gray-500 cursor-not-allowed font-medium text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Professional Bio</label>
                           <textarea 
                              rows={3}
                              defaultValue="Event Curator & Luxury Agency Founder. Capturing memories through a lens of sophistication."
                              className="w-full bg-transparent border border-gray-200 text-[#14241B] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#14241B] transition-all font-medium text-sm resize-none"
                           />
                        </div>
                        
                        <div className="pt-4 flex justify-end">
                           <Button 
                            className="bg-[#14241B] hover:bg-[#1E3629] text-white rounded-full px-8 py-6 text-sm font-bold shadow-md shadow-[#14241B]/10" 
                            onClick={handleSave}
                            isLoading={isSaving}
                           >
                            Save Changes
                           </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan & Billing Tab */}
                {activeTab === 'billing' && (
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-gray-100 flex-1 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-8 right-8 bg-[#14241B]/5 text-[#14241B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#14241B]" />
                         Pro Tier
                      </div>
                      
                      <div>
                        <h2 className="text-2xl font-bold mb-10 text-[#14241B]">Plan & Billing</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                           <div className="space-y-4">
                              <div className="flex justify-between items-end text-sm">
                                 <span className="font-bold text-[#14241B]">Storage Usage</span>
                                 <span className="text-gray-500 font-medium">45.0 / 100 GB</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-[#14241B] w-[45%]" />
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed pt-2">
                                 You've used 45% of your total storage. Upgrade to Unlimited for 4K video archiving.
                              </p>
                           </div>
                           
                           <div className="space-y-2">
                              <div className="text-xs font-bold text-[#14241B]">Next Payment</div>
                              <div className="text-3xl font-bold text-[#14241B]">$49.00 <span className="text-sm text-gray-500 font-normal">monthly</span></div>
                              <p className="text-xs text-gray-500">Billed on Oct 24, 2024</p>
                              
                              <div className="flex gap-3 pt-4">
                                 <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#14241B] shadow-sm hover:bg-gray-50">Manage Cards</button>
                                 <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#14241B] shadow-sm hover:bg-gray-50">Invoices</button>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Event Insights Side Card */}
                    <div className="bg-gradient-to-b from-[#1E2E25] to-[#121A16] rounded-3xl p-8 shadow-xl border border-white/10 w-full lg:w-72 flex flex-col justify-between text-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full" />
                       <div className="relative z-10 space-y-4">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                             <Sparkles className="w-5 h-5 text-emerald-400" />
                          </div>
                          <h3 className="text-xl font-bold">AI Event Insights</h3>
                          <p className="text-sm text-gray-400 leading-relaxed">
                             Memora AI has analyzed your latest 500 images. Your monthly trend report is ready.
                          </p>
                       </div>
                       <button className="w-full bg-white text-[#14241B] py-3 rounded-xl font-bold text-sm mt-8 hover:bg-gray-100 transition-colors">
                          View Report &rarr;
                       </button>
                    </div>
                  </div>
                )}
                
                {/* Fallbacks for other tabs */}
                {(activeTab === 'security' || activeTab === 'notifications') && (
                  <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
                     <h2 className="text-2xl font-bold mb-4 text-[#14241B] capitalize">{activeTab}</h2>
                     <p className="text-gray-500">This section is currently under construction in the new UI theme.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
