"use client"

import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'

interface ReceiptTemplateProps {
  slip: {
    id: string
    slip_number: string
    amount: number
    status: string
    notes?: string
    verified_at?: string
    created_at: string
    image_url?: string
    profiles?: { full_name: string; custom_id: string }
  }
  school: {
    name: string
    subdomain: string
    branding?: { primary_color?: string; secondary_color?: string }
  }
}

// Generates a pseudo transaction hash from the slip id and verified_at timestamp
function generateTxHash(slipId: string, verifiedAt?: string): string {
  const raw = `${slipId}:${verifiedAt || 'unverified'}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  const positiveHash = Math.abs(hash).toString(16).padStart(8, '0')
  return `TXN-${slipId.slice(0, 8).toUpperCase()}-${positiveHash.toUpperCase()}`
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ slip, school }, ref) => {
    const primaryColor = school?.branding?.primary_color || '#0D9488'
    const txHash = generateTxHash(slip.id, slip.verified_at)
    const verificationUrl = `https://${school.subdomain}.craftsms.app/verify/${slip.id}`

    return (
      <div
        ref={ref}
        id="receipt-template"
        style={{
          width: '794px', // A4 at 96dpi
          minHeight: '1123px',
          backgroundColor: '#ffffff',
          color: '#111827',
          fontFamily: 'Arial, sans-serif',
          padding: '64px',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* WATERMARK — School name at 7% opacity, centered */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-35deg)',
          fontSize: '80px',
          fontWeight: '900',
          color: primaryColor,
          opacity: 0.07,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0,
          letterSpacing: '-2px',
        }}>
          {school.name}
        </div>

        {/* Content layer above watermark */}
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: `3px solid ${primaryColor}`, paddingBottom: '24px' }}>
            <div>
              <div style={{
                width: '56px', height: '56px', borderRadius: '12px',
                backgroundColor: primaryColor, display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: '12px'
              }}>
                <span style={{ color: '#fff', fontWeight: '900', fontSize: '20px' }}>
                  {school.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#111827', lineHeight: 1.2 }}>
                {school.name}
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>
                {school.subdomain}.craftsms.app
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Official Receipt
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: '900', color: primaryColor }}>
                #{slip.slip_number}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>
                {new Date(slip.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Student Info */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Issued To
            </p>
            <div style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
              {/* Truncate name to prevent layout overflow (Stress Test requirement) */}
              <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '500px' }}>
                {slip.profiles?.full_name || 'Unknown Student'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
                Student ID: <strong>{slip.profiles?.custom_id || 'N/A'}</strong>
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Payment Details
            </p>
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>Description</span>
                <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>Amount</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>School Fee Payment</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>${slip.amount?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: primaryColor }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>Total Paid</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>${slip.amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div style={{ marginBottom: '40px', padding: '16px 20px', backgroundColor: '#D1FAE5', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}>✓</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#065F46' }}>Payment Verified</p>
              {slip.verified_at && (
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#047857' }}>
                  Verified on {new Date(slip.verified_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Footer: Transaction Hash + QR Code */}
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, marginRight: '24px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Transaction Hash
              </p>
              <p style={{ margin: 0, fontSize: '13px', fontFamily: 'monospace', fontWeight: '700', color: '#374151', wordBreak: 'break-all', backgroundColor: '#F3F4F6', padding: '8px 12px', borderRadius: '8px' }}>
                {txHash}
              </p>
              <p style={{ margin: '12px 0 0', fontSize: '10px', color: '#9CA3AF', lineHeight: 1.6 }}>
                This is an official document generated by CRAFT SMS. Scan the QR code to verify the authenticity of this receipt at any time.
              </p>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <QRCodeCanvas
                value={verificationUrl}
                size={88}
                bgColor="#ffffff"
                fgColor="#111827"
                level="M"
              />
              <p style={{ margin: '6px 0 0', fontSize: '9px', color: '#9CA3AF' }}>Scan to verify</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

ReceiptTemplate.displayName = 'ReceiptTemplate'
