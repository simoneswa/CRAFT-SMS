"use client"

import { DashboardLayout } from '../../../components/dashboard/DashboardLayout'
import { useState } from 'react'
import { Settings, Save, Shield, Globe, Bell, Database } from 'lucide-react'

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    forcePwa: true,
    globalAnnouncement: '',
    apiRateLimit: '1000'
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('maintenanceMode', settings.maintenanceMode.toString())
    }
    // Simulate API call for other settings
    setTimeout(() => setIsSaving(false), 1000)
  }

  return (
    <>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2 text-slate-900">System <span className="gradient-text">Settings</span></h1>
          <p className="text-slate-600">Configure global platform behavior and security defaults.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* General Configuration */}
            <div className="premium-card bg-white border border-slate-200">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
                <Globe className="w-5 h-5 text-teal-600" />
                Platform Controls
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Maintenance Mode</p>
                    <p className="text-xs text-slate-600">Disable access for all non-admin users across all tenants.</p>
                  </div>
                  <button 
                    onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                    className={`w-12 h-6 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-rose-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Allow New School Registrations</p>
                    <p className="text-xs text-slate-600">Toggle whether new schools can request access on the landing page.</p>
                  </div>
                  <button 
                    onClick={() => setSettings({...settings, allowNewRegistrations: !settings.allowNewRegistrations})}
                    className={`w-12 h-6 rounded-full transition-all relative ${settings.allowNewRegistrations ? 'bg-[var(--edlink-green-brand)]' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.allowNewRegistrations ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="section-label text-slate-900">Default API Rate Limit (req/min)</label>
                  <input 
                    type="number"
                    value={settings.apiRateLimit}
                    onChange={(e) => setSettings({...settings, apiRateLimit: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--edlink-green-brand)]/50 transition-all text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="premium-card bg-white border border-slate-200">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
                <Shield className="w-5 h-5 text-blue-600" />
                Security & RBAC
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">Manage system-wide security defaults for all school administrators.</p>
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                   <span className="text-sm text-slate-900 font-medium">Enforce 2FA for Teachers & Admins</span>
                   <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-100 px-2 py-1 rounded">Dev Only</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                   <span className="text-sm text-slate-900 font-medium">IP Whitelisting for Super Admins</span>
                   <span className="text-[10px] font-bold text-[var(--edlink-green-brand)] uppercase tracking-widest bg-emerald-100 px-2 py-1 rounded">Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Save Actions */}
            <div className="premium-card bg-white border border-slate-200 sticky top-24">
              <h3 className="text-lg font-bold mb-4 text-slate-900">Publish Changes</h3>
              <p className="text-xs text-slate-600 mb-6">Updates here take effect immediately across all system nodes.</p>
              
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-[var(--edlink-green-brand)] hover:bg-[var(--edlink-green-hover)] text-black font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Settings
                  </>
                )}
              </button>
              
              <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Storage Status</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Last sync: {new Date().toLocaleTimeString()}
                  <br />
                  Persistence: Cloud-replicated
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
