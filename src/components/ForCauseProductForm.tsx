import React, { useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { createProduct, createForCauseDetails } from '../lib/trustService'
import { ForCausePreview } from './ForCausePreview'

export function ForCauseProductForm({ sellerId }: { sellerId?: string }) {
  // Section 1 - basic
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [category] = useState('For a Cause')

  // Section 2 - cause details
  const [fundraisingCause, setFundraisingCause] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [fundraisingGoal, setFundraisingGoal] = useState<number | ''>('')
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  // Section 3 - images
  const [images, setImages] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string,string>>({})

  const [previewOpen, setPreviewOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e: Record<string,string> = {}
    if (!title || title.trim().length === 0) e.title = 'Title is required'
    if (String(title || '').length > 100) e.title = 'Title too long (max 100)'
    if (!description || description.trim().length === 0) e.description = 'Description is required'
    if (String(description || '').length > 500) e.description = 'Description too long (max 500)'
    if (!price || Number(price) < 1) e.price = 'Price must be at least 1 PHP'

    if (!fundraisingCause || fundraisingCause.trim().length === 0) e.fundraisingCause = 'Fundraising cause is required'
    if (fundraisingCause.length > 300) e.fundraisingCause = 'Cause text is too long (max 300)'
    if (!fundraisingGoal || Number(fundraisingGoal) < Number(price || 0)) e.fundraisingGoal = 'Fundraising goal must be at least the product price'

    if (!verificationDocument) e.verificationDocument = 'Verification document is required'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onChooseVerification = (f?: File | null) => {
    setVerificationError(null)
    if (!f) {
      setVerificationDocument(null)
      return
    }
    const allowed = ['application/pdf', 'image/png', 'image/jpeg']
    if (!allowed.includes(f.type)) {
      setVerificationError('File must be PDF, PNG, or JPG')
      setVerificationDocument(null)
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setVerificationError('File must be smaller than 10MB')
      setVerificationDocument(null)
      return
    }
    setVerificationDocument(f)
  }

  const onChooseImages = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files).slice(0,5)
    const bad = arr.find((f) => f.size > 5 * 1024 * 1024 || !['image/png','image/jpeg'].includes(f.type))
    if (bad) {
      setErrors((prev) => ({ ...prev, images: 'Images must be PNG/JPG and <= 5MB each' }))
      return
    }
    setErrors((prev) => { const c = { ...prev }; delete c.images; return c })
    setImages(arr)
  }

  const onPreview = () => {
    const ok = validate()
    if (!ok) return
    setPreviewOpen(true)
  }

  const onSubmit = async () => {
    const ok = validate()
    if (!ok) return
    setSubmitting(true)

    try {
      // Create product (mock)
      const product = await createProduct({ title, description, price: Number(price), category, images: images.map((i) => i.name), sellerId })

      // Simulate document upload - here we use the file name as URL placeholder
      const docUrl = verificationDocument ? `mock://uploads/${verificationDocument.name}` : ''

      // Create ForCauseDetails
      await createForCauseDetails({
        productId: product.id,
        sellerId: sellerId || 'unknown',
        fundraisingCause,
        organizationName: organizationName || undefined,
        fundraisingGoal: Number(fundraisingGoal),
        verificationDocumentUrl: docUrl,
        verificationDocumentName: verificationDocument?.name || '',
        causeType: 'fundraiser',
      })

      // Show success and reset (production: redirect to dashboard or listing)
      alert('Listing submitted for review (mock).')
      // reset
      setTitle('')
      setDescription('')
      setPrice('')
      setFundraisingCause('')
      setOrganizationName('')
      setFundraisingGoal('')
      setVerificationDocument(null)
      setImages([])
      setPreviewOpen(false)

    } catch (err) {
      console.error(err)
      setErrors((prev) => ({ ...prev, submit: 'Failed to submit listing. Try again.' }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h4 className="font-semibold">Basic details</h4>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm">Title</label>
            <Input value={title} onChange={(e:any)=>setTitle(e.target.value)} placeholder="Title" />
            {errors.title ? <div className="text-xs text-red-600">{errors.title}</div> : null}
          </div>

          <div>
            <label className="block text-sm">Description</label>
            <textarea className="w-full border rounded p-2" value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description" />
            {errors.description ? <div className="text-xs text-red-600">{errors.description}</div> : null}
          </div>

          <div>
            <label className="block text-sm">Price (PHP)</label>
            <Input type="number" value={price as any} onChange={(e:any)=>setPrice(e.target.value ? Number(e.target.value) : '')} min={1} />
            {errors.price ? <div className="text-xs text-red-600">{errors.price}</div> : null}
          </div>

          <div>
            <label className="block text-sm">Category</label>
            <div className="flex items-center"><div className="px-2 py-1 bg-yellow-100 rounded">💛 For a Cause</div></div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h4 className="font-semibold">Fundraiser details</h4>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm">Fundraising Cause</label>
            <textarea className="w-full border rounded p-2" value={fundraisingCause} onChange={(e)=>setFundraisingCause(e.target.value)} placeholder="Describe the purpose of this fundraiser" />
            {errors.fundraisingCause ? <div className="text-xs text-red-600">{errors.fundraisingCause}</div> : null}
          </div>

          <div>
            <label className="block text-sm">Organization / Group (optional)</label>
            <Input value={organizationName} onChange={(e:any)=>setOrganizationName(e.target.value)} placeholder="Organization name" />
          </div>

          <div>
            <label className="block text-sm">Fundraising Goal (PHP)</label>
            <Input type="number" value={fundraisingGoal as any} onChange={(e:any)=>setFundraisingGoal(e.target.value ? Number(e.target.value) : '')} min={price || 1} />
            {errors.fundraisingGoal ? <div className="text-xs text-red-600">{errors.fundraisingGoal}</div> : null}
          </div>

          <div>
            <label className="block text-sm">Verification Document (PDF, JPG, PNG; max 10MB)</label>
            <input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e)=>onChooseVerification(e.target.files?.[0] || null)} />
            {verificationDocument ? <div className="text-xs">Selected: {verificationDocument.name} ({Math.round(verificationDocument.size/1024)} KB)</div> : null}
            {verificationError ? <div className="text-xs text-red-600">{verificationError}</div> : null}
            {errors.verificationDocument ? <div className="text-xs text-red-600">{errors.verificationDocument}</div> : null}
            <div className="text-xs text-muted-foreground mt-1">Upload proof of cause (medical certificate, endorsement letter, or verification document).</div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h4 className="font-semibold">Images & Safety Guidelines</h4>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm">Images (up to 5)</label>
            <input type="file" accept="image/png,image/jpeg" multiple onChange={(e)=>onChooseImages(e.target.files)} />
            {errors.images ? <div className="text-xs text-red-600">{errors.images}</div> : null}
            <div className="text-xs text-muted-foreground mt-1">PNG/JPG up to 5MB each.</div>
            {images.length ? <div className="text-xs mt-1">Selected: {images.map((i)=>i.name).join(', ')}</div> : null}
          </div>

          <ul className="text-xs list-disc pl-5 text-muted-foreground">
            <li>Meet in public places</li>
            <li>Verify items before transfer</li>
            <li>Bring a friend if possible</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3">
        <Button variant="ghost" onClick={()=>{
          // cancel -> reset
          setTitle(''); setDescription(''); setPrice(''); setFundraisingCause(''); setOrganizationName(''); setFundraisingGoal(''); setVerificationDocument(null); setImages([]); setErrors({})
        }}>Cancel</Button>
        <Button onClick={onPreview}>Preview Listing</Button>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-11/12 max-w-2xl p-4 bg-white rounded">
            <ForCausePreview data={{ title, description, price, fundraisingGoal, fundraisingCause, organizationName }} />

            <div className="flex justify-end mt-4 space-x-3">
              <Button variant="ghost" onClick={()=>setPreviewOpen(false)}>Cancel</Button>
              <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Listing'}</Button>
            </div>
          </div>
        </div>
      )}

      {errors.submit ? <div className="text-sm text-red-600">{errors.submit}</div> : null}
    </div>
  )
}