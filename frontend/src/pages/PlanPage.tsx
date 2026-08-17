import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import PlanForm from '../components/PlanForm'
import PreferenceForm from '../components/PreferenceForm'

export default function PlanPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [basicInfo, setBasicInfo] = useState<any>(null)

  const initialDestination = searchParams.get('destination') || ''

  const handleBasicNext = (data: any) => {
    setBasicInfo(data)
    setStep(2)
  }

  const handlePreferenceSubmit = (prefs: any) => {
    const fullRequest = { ...basicInfo, ...prefs }
    navigate('/itinerary/new', { state: { request: fullRequest } })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-0 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>1</div>
            <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>2</div>
            <div className={`h-0.5 w-12 bg-gray-200`} />
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-200 text-gray-400">3</div>
          </div>
          <div className="flex justify-center gap-16 text-xs text-gray-400">
            <span className={step >= 1 ? 'text-blue-600 font-semibold' : ''}>基本信息</span>
            <span className={step >= 2 ? 'text-blue-600 font-semibold' : ''}>偏好设置</span>
            <span>确认提交</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {step === 1 && (
          <PlanForm initialDestination={initialDestination} onNext={handleBasicNext} />
        )}
        {step === 2 && (
          <PreferenceForm
            onBack={() => setStep(1)}
            onSubmit={handlePreferenceSubmit}
          />
        )}
      </div>
    </div>
  )
}