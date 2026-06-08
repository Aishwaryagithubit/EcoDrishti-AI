import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubmitCarbonData, useGenerateRecommendations, useGetRecommendations, getGetRecommendationsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, Brain, Leaf, AlertCircle, CheckCircle, TrendingDown, Clock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DIFF_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  hard: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
};
const IMPACT_COLORS: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-amber-600',
  high: 'text-emerald-600',
};

interface SubmissionResult {
  id: number;
  totalEmissionsKg: number;
  transportEmissionsKg: number;
  electricityEmissionsKg: number;
  waterEmissionsKg: number;
  wasteEmissionsKg: number;
  sustainabilityScore: number;
  dataConfidenceScore: number;
  status: string;
}

export default function CarbonCalculatorPage() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  const now = new Date();
  const [exactData, setExactData] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    studentCount: 500,
    staffCount: 30,
    electricityKwh: '',
    waterLiters: '',
    wasteKg: '',
    recyclingKg: '',
    compostingKg: '',
    busRiders: '',
    walkersOrCyclers: '',
    carRiders: '',
    fuelLiters: '',
  });

  const [estimateData, setEstimateData] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    studentCount: 500,
    staffCount: 30,
    classroomCount: '',
    lightCount: '',
    fanCount: '',
    hasComputerLab: false,
    busRiders: '',
    walkersOrCyclers: '',
    carRiders: '',
  });

  const submitMutation = useSubmitCarbonData({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        setSubmissionId(data.id);
        toast({ title: lang === 'np' ? 'डेटा सफलतापूर्वक सबमिट भयो!' : 'Data submitted successfully!' });
      },
    },
  });

  const genRecMutation = useGenerateRecommendations({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRecommendationsQueryKey() });
        toast({ title: lang === 'np' ? 'एआई सिफारिसहरू तयार!' : 'AI Recommendations ready!' });
      },
    },
  });

  const { data: recommendations } = useGetRecommendations({
    query: { enabled: !!submissionId, queryKey: getGetRecommendationsQueryKey() }
  });

  const handleExactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      data: {
        month: exactData.month,
        year: exactData.year,
        studentCount: exactData.studentCount,
        staffCount: exactData.staffCount,
        electricityKwh: exactData.electricityKwh ? parseFloat(exactData.electricityKwh) : null,
        waterLiters: exactData.waterLiters ? parseFloat(exactData.waterLiters) : null,
        wasteKg: exactData.wasteKg ? parseFloat(exactData.wasteKg) : null,
        recyclingKg: exactData.recyclingKg ? parseFloat(exactData.recyclingKg) : null,
        compostingKg: exactData.compostingKg ? parseFloat(exactData.compostingKg) : null,
        busRiders: exactData.busRiders ? parseInt(exactData.busRiders) : null,
        walkersOrCyclers: exactData.walkersOrCyclers ? parseInt(exactData.walkersOrCyclers) : null,
        carRiders: exactData.carRiders ? parseInt(exactData.carRiders) : null,
        fuelLiters: exactData.fuelLiters ? parseFloat(exactData.fuelLiters) : null,
      }
    });
  };

  const handleEstimateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      data: {
        month: estimateData.month,
        year: estimateData.year,
        studentCount: estimateData.studentCount,
        staffCount: estimateData.staffCount,
        classroomCount: estimateData.classroomCount ? parseInt(estimateData.classroomCount) : null,
        lightCount: estimateData.lightCount ? parseInt(estimateData.lightCount) : null,
        fanCount: estimateData.fanCount ? parseInt(estimateData.fanCount) : null,
        hasComputerLab: estimateData.hasComputerLab,
        busRiders: estimateData.busRiders ? parseInt(estimateData.busRiders) : null,
        walkersOrCyclers: estimateData.walkersOrCyclers ? parseInt(estimateData.walkersOrCyclers) : null,
        carRiders: estimateData.carRiders ? parseInt(estimateData.carRiders) : null,
      }
    });
  };

  const catColor: Record<string, string> = {
    transport: 'text-emerald-600',
    electricity: 'text-teal-600',
    water: 'text-blue-600',
    waste: 'text-purple-600',
    general: 'text-amber-600',
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            {lang === 'np' ? 'कार्बन क्याल्कुलेटर' : 'Carbon Calculator'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'np' ? 'आफ्नो विद्यालयको कार्बन फुटप्रिन्ट मापन गर्नुहोस्' : 'Measure your school\'s carbon footprint'}
          </p>
        </div>

        <Tabs defaultValue="exact">
          <TabsList className="w-full">
            <TabsTrigger value="exact" className="flex-1">
              {lang === 'np' ? 'सटीक डेटा (प्राथमिकता)' : 'Exact Data (Preferred)'}
            </TabsTrigger>
            <TabsTrigger value="estimate" className="flex-1">
              {lang === 'np' ? 'अनुमान (फलब्याक)' : 'Estimate (Fallback)'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exact" className="mt-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 text-sm text-primary">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              {lang === 'np' ? 'उच्च डेटा आत्मविश्वास स्कोरको लागि वास्तविक रेकर्डहरू प्रयोग गर्नुहोस्।' : 'Use actual records for highest data confidence score.'}
            </div>
            <form onSubmit={handleExactSubmit} className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <Label>{lang === 'np' ? 'महिना' : 'Month'}</Label>
                  <Input type="number" min={1} max={12} value={exactData.month} onChange={e => setExactData(d => ({ ...d, month: +e.target.value }))} required />
                </div>
                <div>
                  <Label>{lang === 'np' ? 'वर्ष' : 'Year'}</Label>
                  <Input type="number" min={2020} max={2030} value={exactData.year} onChange={e => setExactData(d => ({ ...d, year: +e.target.value }))} required />
                </div>
                <div>
                  <Label>{lang === 'np' ? 'विद्यार्थी संख्या' : 'Students'}</Label>
                  <Input type="number" min={1} value={exactData.studentCount} onChange={e => setExactData(d => ({ ...d, studentCount: +e.target.value }))} required />
                </div>
                <div>
                  <Label>{lang === 'np' ? 'कर्मचारी संख्या' : 'Staff'}</Label>
                  <Input type="number" min={1} value={exactData.staffCount} onChange={e => setExactData(d => ({ ...d, staffCount: +e.target.value }))} required />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 bg-teal-100 dark:bg-teal-900/40 rounded-md flex items-center justify-center text-teal-600 text-xs">⚡</span>
                  {lang === 'np' ? 'ऊर्जा र पानी' : 'Energy & Water'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{lang === 'np' ? 'बिजुली खपत (kWh)' : 'Electricity Used (kWh)'}</Label>
                    <Input type="number" placeholder="e.g. 2500" value={exactData.electricityKwh} onChange={e => setExactData(d => ({ ...d, electricityKwh: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'पानी उपयोग (लिटर)' : 'Water Usage (liters)'}</Label>
                    <Input type="number" placeholder="e.g. 15000" value={exactData.waterLiters} onChange={e => setExactData(d => ({ ...d, waterLiters: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/40 rounded-md flex items-center justify-center text-purple-600 text-xs">♻️</span>
                  {lang === 'np' ? 'फोहोर व्यवस्थापन' : 'Waste Management'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>{lang === 'np' ? 'कुल फोहोर (kg)' : 'Total Waste (kg)'}</Label>
                    <Input type="number" placeholder="e.g. 200" value={exactData.wasteKg} onChange={e => setExactData(d => ({ ...d, wasteKg: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'पुनःचक्रण (kg)' : 'Recycled (kg)'}</Label>
                    <Input type="number" placeholder="e.g. 50" value={exactData.recyclingKg} onChange={e => setExactData(d => ({ ...d, recyclingKg: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'कम्पोस्ट (kg)' : 'Composted (kg)'}</Label>
                    <Input type="number" placeholder="e.g. 30" value={exactData.compostingKg} onChange={e => setExactData(d => ({ ...d, compostingKg: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/40 rounded-md flex items-center justify-center text-emerald-600 text-xs">🚌</span>
                  {lang === 'np' ? 'यातायात' : 'Transportation'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <Label>{lang === 'np' ? 'बस सवारीहरू' : 'Bus Riders'}</Label>
                    <Input type="number" placeholder="e.g. 200" value={exactData.busRiders} onChange={e => setExactData(d => ({ ...d, busRiders: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'पैदल/साइकल' : 'Walk/Cycle'}</Label>
                    <Input type="number" placeholder="e.g. 150" value={exactData.walkersOrCyclers} onChange={e => setExactData(d => ({ ...d, walkersOrCyclers: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'कार सवारीहरू' : 'Car Riders'}</Label>
                    <Input type="number" placeholder="e.g. 100" value={exactData.carRiders} onChange={e => setExactData(d => ({ ...d, carRiders: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'इन्धन (लिटर)' : 'Fuel (liters)'}</Label>
                    <Input type="number" placeholder="e.g. 120" value={exactData.fuelLiters} onChange={e => setExactData(d => ({ ...d, fuelLiters: e.target.value }))} />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? (lang === 'np' ? 'गणना हुँदैछ...' : 'Calculating...') : (lang === 'np' ? 'कार्बन फुटप्रिन्ट गणना गर्नुहोस्' : 'Calculate Carbon Footprint')}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="estimate" className="mt-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              {lang === 'np' ? 'यदि सटीक रेकर्डहरू उपलब्ध छैनन् भने, हामी अनुमानित गणना प्रयोग गर्नेछौं।' : 'If exact records are unavailable, we estimate based on context.'}
            </div>
            <form onSubmit={handleEstimateSubmit} className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <Label>{lang === 'np' ? 'महिना' : 'Month'}</Label>
                  <Input type="number" min={1} max={12} value={estimateData.month} onChange={e => setEstimateData(d => ({ ...d, month: +e.target.value }))} required />
                </div>
                <div>
                  <Label>{lang === 'np' ? 'वर्ष' : 'Year'}</Label>
                  <Input type="number" min={2020} max={2030} value={estimateData.year} onChange={e => setEstimateData(d => ({ ...d, year: +e.target.value }))} required />
                </div>
                <div>
                  <Label>{lang === 'np' ? 'विद्यार्थी' : 'Students'}</Label>
                  <Input type="number" min={1} value={estimateData.studentCount} onChange={e => setEstimateData(d => ({ ...d, studentCount: +e.target.value }))} required />
                </div>
                <div>
                  <Label>{lang === 'np' ? 'कर्मचारी' : 'Staff'}</Label>
                  <Input type="number" min={1} value={estimateData.staffCount} onChange={e => setEstimateData(d => ({ ...d, staffCount: +e.target.value }))} required />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold">{lang === 'np' ? 'पूर्वाधार प्रश्नहरू' : 'Infrastructure Questions'}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>{lang === 'np' ? 'कक्षाकोठाको संख्या' : 'Classrooms'}</Label>
                    <Input type="number" placeholder="20" value={estimateData.classroomCount} onChange={e => setEstimateData(d => ({ ...d, classroomCount: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'बत्तीको संख्या' : 'Light Bulbs'}</Label>
                    <Input type="number" placeholder="100" value={estimateData.lightCount} onChange={e => setEstimateData(d => ({ ...d, lightCount: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'पंखाहरू' : 'Fans'}</Label>
                    <Input type="number" placeholder="40" value={estimateData.fanCount} onChange={e => setEstimateData(d => ({ ...d, fanCount: e.target.value }))} />
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={estimateData.hasComputerLab} onChange={e => setEstimateData(d => ({ ...d, hasComputerLab: e.target.checked }))} className="w-4 h-4 accent-primary" />
                      {lang === 'np' ? 'कम्प्युटर प्रयोगशाला छ?' : 'Has computer lab?'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-semibold">{lang === 'np' ? 'यातायात ढाँचा' : 'Transportation Pattern'}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{lang === 'np' ? 'बसमा आउने' : 'By Bus'}</Label>
                    <Input type="number" placeholder="200" value={estimateData.busRiders} onChange={e => setEstimateData(d => ({ ...d, busRiders: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'पैदल/साइकल' : 'Walk/Cycle'}</Label>
                    <Input type="number" placeholder="150" value={estimateData.walkersOrCyclers} onChange={e => setEstimateData(d => ({ ...d, walkersOrCyclers: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{lang === 'np' ? 'कारमा आउने' : 'By Car'}</Label>
                    <Input type="number" placeholder="100" value={estimateData.carRiders} onChange={e => setEstimateData(d => ({ ...d, carRiders: e.target.value }))} />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? (lang === 'np' ? 'अनुमान हुँदैछ...' : 'Estimating...') : (lang === 'np' ? 'उत्सर्जन अनुमान गर्नुहोस्' : 'Estimate Emissions')}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Results */}
        {result && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-primary" />
                {lang === 'np' ? 'तपाईंको कार्बन रिपोर्ट' : 'Your Carbon Report'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                  <div className="text-2xl font-extrabold text-rose-600">{result.totalEmissionsKg.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">kg CO₂ Total</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                  <div className="text-2xl font-extrabold text-emerald-600">{result.sustainabilityScore.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">{lang === 'np' ? 'दिगोपन स्कोर' : 'Sustainability Score'}</div>
                </div>
                <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl col-span-2 sm:col-span-1">
                  <div className="text-2xl font-extrabold text-blue-600">{result.dataConfidenceScore.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">{lang === 'np' ? 'डेटा आत्मविश्वास' : 'Data Confidence'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: lang === 'np' ? 'यातायात' : 'Transport', value: result.transportEmissionsKg, color: '#059669' },
                  { label: lang === 'np' ? 'बिजुली' : 'Electricity', value: result.electricityEmissionsKg, color: '#0d9488' },
                  { label: lang === 'np' ? 'पानी' : 'Water', value: result.waterEmissionsKg, color: '#3b82f6' },
                  { label: lang === 'np' ? 'फोहोर' : 'Waste', value: result.wasteEmissionsKg, color: '#8b5cf6' },
                ].map(cat => (
                  <div key={cat.label} className="bg-white/50 dark:bg-black/20 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold" style={{ color: cat.color }}>{cat.value.toFixed(1)} kg</div>
                    <div className="text-xs text-muted-foreground">{cat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Brain className="w-5 h-5 text-amber-600" />
                  {lang === 'np' ? 'एआई सिफारिसहरू' : 'AI Recommendations'}
                </h2>
                {!recommendations?.length && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => genRecMutation.mutate({ data: { submissionId: result.id } })}
                    disabled={genRecMutation.isPending}
                  >
                    <Brain className="w-3.5 h-3.5 mr-1.5" />
                    {genRecMutation.isPending ? (lang === 'np' ? 'उत्पन्न हुँदैछ...' : 'Generating...') : (lang === 'np' ? 'सिफारिसहरू उत्पन्न गर्नुहोस्' : 'Generate Recommendations')}
                  </Button>
                )}
              </div>
              {recommendations && recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.map(rec => (
                    <div key={rec.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${catColor[rec.category]}`}>
                          {rec.category === 'transport' ? '🚌' : rec.category === 'electricity' ? '⚡' : rec.category === 'water' ? '💧' : '♻️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-semibold text-sm text-foreground">
                              {lang === 'np' ? rec.titleNp : rec.title}
                            </h4>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${DIFF_COLORS[rec.difficulty]}`}>
                              {rec.difficulty}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {lang === 'np' ? rec.descriptionNp : rec.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`flex items-center gap-1 font-medium ${IMPACT_COLORS[rec.impact]}`}>
                              <TrendingDown className="w-3 h-3" />
                              {rec.estimatedCarbonReductionKg.toFixed(0)} kg CO₂ saved
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {rec.timeline}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground">
                  <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{lang === 'np' ? 'एआई सिफारिसहरू उत्पन्न गर्न माथिको बटन क्लिक गर्नुहोस्।' : 'Click the button above to generate AI-powered recommendations.'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
