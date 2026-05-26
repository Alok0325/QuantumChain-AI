import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../../context/AuthContext';

// --- styling helpers (kept local so the JSX below reads cleanly) ----------

const LABEL = 'text-xs uppercase tracking-wider text-slate-400 font-medium';
const INPUT =
  'bg-black/30 text-slate-100 border border-white/10 px-3.5 py-2.5 rounded-lg text-sm ' +
  'focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';
const REQUIRED = <span className="text-rose-400 ml-0.5">*</span>;
const SECTION_TITLE = 'text-base font-semibold text-slate-100 mb-3 pb-2 border-b border-white/[0.06]';

const Field = ({ label, required, children, hint }) => (
  <label className="flex flex-col gap-1.5">
    <span className={LABEL}>
      {label}{required && REQUIRED}
    </span>
    {children}
    {hint && <span className="text-xs text-slate-500">{hint}</span>}
  </label>
);

const FormRow = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
);

// --- KYC sub-form --------------------------------------------------------

const KycSection = ({ formData, isEditing, isSaving, onChange, onSubmit, onToggleEdit }) => {
  const locked = !isEditing || formData.kycVerified;

  return (
    <article className="qc-card">
      <header className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">KYC Verification</h3>
          <p className="text-sm text-slate-400 mt-1">Required for live trading and increased limits.</p>
        </div>
        {formData.kycStatus !== 'verified' && (
          <button type="button" className="qc-btn qc-btn-ghost" onClick={onToggleEdit}>
            {isEditing ? 'Cancel' : 'Update KYC'}
          </button>
        )}
      </header>

      <div className="mb-5">
        <span
          className={`inline-block px-3 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider border ${
            formData.kycStatus === 'verified'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
              : formData.kycStatus === 'rejected'
              ? 'bg-rose-500/15 text-rose-300 border-rose-400/35'
              : 'bg-amber-500/15 text-amber-300 border-amber-400/35'
          }`}
        >
          {formData.kycStatus === 'verified'
            ? 'Verified'
            : formData.kycStatus === 'pending'
            ? 'Pending Verification'
            : 'Not Verified'}
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div>
          <h4 className={SECTION_TITLE}>Personal Information</h4>
          <FormRow>
            <Field label="Date of Birth" required>
              <input
                type="date" name="dateOfBirth" required disabled={locked}
                className={INPUT} value={formData.dateOfBirth} onChange={onChange}
              />
            </Field>
            <Field label="Gender" required>
              <select name="gender" required disabled={locked} className={INPUT}
                value={formData.gender} onChange={onChange}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </FormRow>
          <div className="mt-4">
            <FormRow>
              <Field label="Nationality" required>
                <input type="text" name="nationality" required disabled={locked}
                  className={INPUT} value={formData.nationality} onChange={onChange} />
              </Field>
              <Field label="Occupation" required>
                <input type="text" name="occupation" required disabled={locked}
                  className={INPUT} value={formData.occupation} onChange={onChange} />
              </Field>
            </FormRow>
          </div>
        </div>

        <div>
          <h4 className={SECTION_TITLE}>Address Information</h4>
          <div className="flex flex-col gap-4">
            <Field label="Address Line 1" required>
              <input type="text" name="addressLine1" required disabled={locked}
                placeholder="House/Flat No, Building Name, Street"
                className={INPUT} value={formData.addressLine1} onChange={onChange} />
            </Field>
            <Field label="Address Line 2">
              <input type="text" name="addressLine2" disabled={locked}
                placeholder="Area, Landmark"
                className={INPUT} value={formData.addressLine2} onChange={onChange} />
            </Field>
            <FormRow>
              <Field label="City" required>
                <input type="text" name="city" required disabled={locked}
                  className={INPUT} value={formData.city} onChange={onChange} />
              </Field>
              <Field label="State" required>
                <input type="text" name="state" required disabled={locked}
                  className={INPUT} value={formData.state} onChange={onChange} />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="PIN Code" required>
                <input type="text" name="pincode" required pattern="[0-9]{6}"
                  title="6-digit PIN code" disabled={locked}
                  className={INPUT} value={formData.pincode} onChange={onChange} />
              </Field>
              <Field label="Country">
                <input type="text" name="country" disabled readOnly className={INPUT} value={formData.country} />
              </Field>
            </FormRow>
          </div>
        </div>

        <div>
          <h4 className={SECTION_TITLE}>Identity Documents</h4>
          <div className="flex flex-col gap-4">
            <Field label="PAN Card Number" required hint="e.g. ABCDE1234F">
              <div className="flex gap-2 items-center">
                <input type="text" name="panNumber" required disabled={!isEditing || formData.panVerified}
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  className={INPUT + ' flex-1'} value={formData.panNumber} onChange={onChange} />
                {formData.panVerified && (
                  <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 text-xs font-semibold">✓ Verified</span>
                )}
              </div>
            </Field>
            {isEditing && !formData.panVerified && (
              <Field label="Upload PAN Card" required hint="JPEG / PNG, max 5MB">
                <input type="file" name="panCardImage" accept="image/*" required
                  className="text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-cyan-300/15 file:text-cyan-300 file:font-medium file:cursor-pointer"
                  onChange={onChange} />
              </Field>
            )}
            <Field label="Aadhar Number" required hint="12 digits">
              <div className="flex gap-2 items-center">
                <input type="text" name="aadharNumber" required pattern="[0-9]{12}"
                  disabled={!isEditing || formData.aadharVerified}
                  className={INPUT + ' flex-1'} value={formData.aadharNumber} onChange={onChange} />
                {formData.aadharVerified && (
                  <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 text-xs font-semibold">✓ Verified</span>
                )}
              </div>
            </Field>
            {isEditing && !formData.aadharVerified && (
              <FormRow>
                <Field label="Aadhar Front" required hint="JPEG / PNG">
                  <input type="file" name="aadharFrontImage" accept="image/*" required
                    className="text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-cyan-300/15 file:text-cyan-300 file:font-medium file:cursor-pointer"
                    onChange={onChange} />
                </Field>
                <Field label="Aadhar Back" required hint="JPEG / PNG">
                  <input type="file" name="aadharBackImage" accept="image/*" required
                    className="text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-cyan-300/15 file:text-cyan-300 file:font-medium file:cursor-pointer"
                    onChange={onChange} />
                </Field>
              </FormRow>
            )}
          </div>
        </div>

        <div>
          <h4 className={SECTION_TITLE}>Address Proof</h4>
          <div className="flex flex-col gap-4">
            <Field label="Proof Type" required>
              <select name="addressProofType" required disabled={locked} className={INPUT}
                value={formData.addressProofType} onChange={onChange}>
                <option value="">Select Proof Type</option>
                <option value="utility_bill">Utility Bill</option>
                <option value="bank_statement">Bank Statement</option>
                <option value="rental_agreement">Rental Agreement</option>
                <option value="passport">Passport</option>
              </select>
            </Field>
            <FormRow>
              <Field label="Document Number" required>
                <input type="text" name="addressProofNumber" required disabled={locked}
                  className={INPUT} value={formData.addressProofNumber} onChange={onChange} />
              </Field>
              <Field label="Document Date" required>
                <input type="date" name="addressProofDate" required disabled={locked}
                  className={INPUT} value={formData.addressProofDate} onChange={onChange} />
              </Field>
            </FormRow>
            {isEditing && !formData.kycVerified && (
              <Field label="Upload Document" required hint="JPEG / PNG / PDF, max 5MB">
                <input type="file" name="addressProofImage" accept="image/*,application/pdf" required
                  className="text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-cyan-300/15 file:text-cyan-300 file:font-medium file:cursor-pointer"
                  onChange={onChange} />
              </Field>
            )}
          </div>
        </div>

        <div>
          <h4 className={SECTION_TITLE}>Bank Account Details</h4>
          <div className="flex flex-col gap-4">
            <FormRow>
              <Field label="Bank Name" required>
                <input type="text" name="bankName" required disabled={!isEditing || formData.bankVerified}
                  className={INPUT} value={formData.bankName} onChange={onChange} />
              </Field>
              <Field label="Account Type" required>
                <select name="accountType" required disabled={!isEditing || formData.bankVerified} className={INPUT}
                  value={formData.accountType} onChange={onChange}>
                  <option value="">Select Account Type</option>
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Account Number" required>
                <input type="text" name="accountNumber" required pattern="[0-9]{9,18}"
                  disabled={!isEditing || formData.bankVerified}
                  className={INPUT} value={formData.accountNumber} onChange={onChange} />
              </Field>
              <Field label="IFSC Code" required hint="e.g. HDFC0001234">
                <input type="text" name="ifscCode" required pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
                  disabled={!isEditing || formData.bankVerified}
                  className={INPUT} value={formData.ifscCode} onChange={onChange} />
              </Field>
            </FormRow>
          </div>
        </div>

        {isEditing && !formData.kycVerified && (
          <div className="flex gap-3 justify-end">
            <button type="submit" className="qc-btn qc-btn-primary" disabled={isSaving}>
              {isSaving ? 'Submitting…' : 'Submit for Verification'}
            </button>
          </div>
        )}

        {!isEditing && !formData.kycVerified && formData.panNumber && (
          <div className="flex items-center gap-3 bg-amber-500/8 border border-amber-400/25 px-4 py-3 rounded-lg text-amber-300 text-sm">
            <span className="text-lg">⏳</span>
            <span>Your KYC verification is in progress. This usually takes 24-48 hours.</span>
          </div>
        )}

        {formData.kycStatus === 'rejected' && (
          <div className="bg-rose-500/10 border border-rose-400/35 px-4 py-3 rounded-lg">
            <h4 className="text-rose-400 font-semibold mb-1">Verification Failed</h4>
            <p className="text-slate-300 text-sm">{formData.kycRejectionReason}</p>
          </div>
        )}
      </form>

      <div className="mt-6 bg-cyan-300/6 border border-cyan-300/25 rounded-xl px-5 py-4">
        <h4 className="text-cyan-300 text-sm font-semibold uppercase tracking-wider mb-2">KYC Guidelines</h4>
        <ul className="text-slate-300 text-sm leading-relaxed space-y-1.5 list-disc list-inside">
          <li>All fields marked with {REQUIRED} are mandatory.</li>
          <li>Ensure all documents are clear and all details are visible.</li>
          <li>Address proof should not be older than 3 months.</li>
          <li>Bank account should be in your name and active.</li>
          <li>Verification process typically takes 24-48 hours.</li>
          <li>Trading limits will be restricted until KYC is verified.</li>
        </ul>
      </div>
    </article>
  );
};

// --- Profile root --------------------------------------------------------

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'kyc', label: 'KYC' },
  { id: 'binance', label: 'Binance API' },
  { id: 'security', label: 'Security' },
];

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    binanceApiKey: user?.binanceApiKey || '',
    binanceApiSecret: user?.binanceApiSecret || '',
    twoFactorEnabled: user?.twoFactorEnabled || false,
    notificationsEnabled: user?.notificationsEnabled || true,
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    nationality: user?.nationality || '',
    occupation: user?.occupation || '',
    addressLine1: user?.addressLine1 || '',
    addressLine2: user?.addressLine2 || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    country: user?.country || 'India',
    panNumber: user?.panNumber || '',
    panVerified: user?.panVerified || false,
    panCardImage: null,
    aadharNumber: user?.aadharNumber || '',
    aadharVerified: user?.aadharVerified || false,
    aadharFrontImage: null,
    aadharBackImage: null,
    addressProofType: user?.addressProofType || '',
    addressProofNumber: user?.addressProofNumber || '',
    addressProofImage: null,
    addressProofDate: user?.addressProofDate || '',
    bankName: user?.bankName || '',
    accountNumber: user?.accountNumber || '',
    ifscCode: user?.ifscCode || '',
    accountType: user?.accountType || '',
    bankVerified: user?.bankVerified || false,
    kycStatus: user?.kycStatus || 'pending',
    kycVerifiedDate: user?.kycVerifiedDate || null,
    kycRejectionReason: user?.kycRejectionReason || '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile?.(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
    setIsSaving(false);
  };

  const ProfileTab = (
    <article className="qc-card">
      <header className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">Profile Information</h3>
          <p className="text-sm text-slate-400 mt-1">Your contact and identity essentials.</p>
        </div>
        <button type="button" className="qc-btn qc-btn-ghost" onClick={() => setIsEditing((v) => !v)}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Full Name">
          <input type="text" name="name" disabled={!isEditing} placeholder="Enter your full name"
            className={INPUT} value={formData.name} onChange={handleChange} />
        </Field>
        <Field label="Email">
          <input type="email" name="email" disabled={!isEditing} placeholder="Enter your email"
            className={INPUT} value={formData.email} onChange={handleChange} />
        </Field>
        <Field label="Phone Number">
          <input type="tel" name="phone" disabled={!isEditing} placeholder="Enter your phone number"
            className={INPUT} value={formData.phone} onChange={handleChange} />
        </Field>
        {isEditing && (
          <div className="flex gap-3 justify-end">
            <button type="submit" className="qc-btn qc-btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </article>
  );

  const BinanceTab = (
    <article className="qc-card">
      <header className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">Binance API Keys</h3>
          <p className="text-sm text-slate-400 mt-1">
            Use the dedicated encrypted vault at{' '}
            <Link to="/settings/api-keys" className="text-cyan-300 hover:underline">/settings/api-keys</Link>{' '}
            for production. This local view shows what&apos;s tied to your profile only.
          </p>
        </div>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="API Key">
          <input type="text" name="binanceApiKey" disabled={!isEditing}
            placeholder="Enter your Binance API key"
            className={INPUT + ' font-mono'} value={formData.binanceApiKey} onChange={handleChange} />
        </Field>
        <Field label="API Secret">
          <input type="password" name="binanceApiSecret" disabled={!isEditing}
            placeholder="Enter your Binance API secret"
            className={INPUT + ' font-mono'} value={formData.binanceApiSecret} onChange={handleChange} />
        </Field>
        <div className="flex justify-between items-center">
          <span
            className={`inline-block px-3 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider border ${
              formData.binanceApiKey
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
                : 'bg-slate-500/12 text-slate-400 border-slate-400/35'
            }`}
          >
            {formData.binanceApiKey ? 'Connected' : 'Not Connected'}
          </span>
          <button type="button" className="qc-btn qc-btn-ghost" onClick={() => setIsEditing((v) => !v)}>
            {isEditing ? 'Cancel' : 'Edit API Keys'}
          </button>
        </div>
        {isEditing && (
          <div className="flex gap-3 justify-end">
            <button type="submit" className="qc-btn qc-btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save API Keys'}
            </button>
          </div>
        )}
      </form>
    </article>
  );

  const SecurityTab = (
    <article className="qc-card">
      <header className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">Security & Notifications</h3>
          <p className="text-sm text-slate-400 mt-1">
            For real TOTP enrollment, go to{' '}
            <Link to="/settings/2fa" className="text-cyan-300 hover:underline">/settings/2fa</Link>.
          </p>
        </div>
        <button type="button" className="qc-btn qc-btn-ghost" onClick={() => setIsEditing((v) => !v)}>
          {isEditing ? 'Cancel' : 'Edit Security'}
        </button>
      </header>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="twoFactorEnabled" disabled={!isEditing}
            className="w-4 h-4 accent-cyan-300"
            checked={formData.twoFactorEnabled} onChange={handleChange} />
          <span className="text-slate-200">Enable Two-Factor Authentication</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="notificationsEnabled" disabled={!isEditing}
            className="w-4 h-4 accent-cyan-300"
            checked={formData.notificationsEnabled} onChange={handleChange} />
          <span className="text-slate-200">Enable Email Notifications</span>
        </label>
        {isEditing && (
          <div className="flex gap-3 justify-end">
            <button type="submit" className="qc-btn qc-btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Security Settings'}
            </button>
          </div>
        )}
      </form>
    </article>
  );

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6 text-slate-100">
      <header>
        <h1 className="text-3xl font-bold qc-title-gradient">Profile Settings</h1>
        <p className="mt-2 text-slate-300 leading-relaxed">
          Manage your account settings and preferences.
        </p>
      </header>

      <div className="flex gap-1 p-1 bg-black/25 rounded-xl border border-white/10 self-start flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === t.id ? 'bg-cyan-300/20 text-cyan-300' : 'text-slate-300 hover:bg-white/[0.04]'
            }`}
            onClick={() => { setActiveTab(t.id); setIsEditing(false); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && ProfileTab}
      {activeTab === 'binance' && BinanceTab}
      {activeTab === 'security' && SecurityTab}
      {activeTab === 'kyc' && (
        <KycSection
          formData={formData}
          isEditing={isEditing}
          isSaving={isSaving}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onToggleEdit={() => setIsEditing((v) => !v)}
        />
      )}
    </div>
  );
};

export default Profile;
