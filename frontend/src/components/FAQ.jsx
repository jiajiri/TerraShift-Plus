import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export default function FAQ({ climate, soil, terrain, optimization }) {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState(null);

  const rainStr = climate?.annual_precip_mm ? `${climate.annual_precip_mm} mm/yr` : 'regional historical averages';
  const etStr = climate?.fao56_reference_et_mm_day ? `${(climate.fao56_reference_et_mm_day * 365).toFixed(0)} mm/yr` : '1350 mm/yr';
  const awcStr = soil?.awc_mm ? `${soil.awc_mm} mm` : '140 mm';
  const slopeStr = terrain?.slope_pct !== undefined ? `${terrain.slope_pct}%` : '2.0%';
  const clusterStr = optimization?.regime?.assigned_cluster_name || 'Semiarid Transition';
  const mahalanobisStr = optimization?.regime?.mahalanobis_distance !== undefined ? optimization.regime.mahalanobis_distance.toFixed(2) : '1.20';
  const gwetZStr = climate?.gwet_root_z !== undefined ? climate.gwet_root_z : 0.0;

  const faqItems = [
    {
      q: t('faq.q1'),
      a: t('faq.a1', { rain: rainStr, et0: etStr, awc: awcStr, slope: slopeStr })
    },
    {
      q: t('faq.q2'),
      a: t('faq.a2', { gwet_z: gwetZStr, cluster: clusterStr, mahalanobis: mahalanobisStr })
    },
    {
      q: t('faq.q3'),
      a: t('faq.a3')
    },
    {
      q: t('faq.q4'),
      a: t('faq.a4')
    },
    {
      q: t('faq.q5'),
      a: t('faq.a5')
    }
  ];

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="bg-white p-5 border border-[#DDD9CE]">
      <div className="flex items-center space-x-2 pb-3 border-b border-[#DDD9CE] mb-4">
        <HelpCircle className="w-4 h-4 text-[#234E36]" />
        <h3 className="text-xs font-mono font-semibold text-[#1C231F] uppercase tracking-wide">
          {t('faq.title')}
        </h3>
      </div>
      <div className="divide-y divide-[#DDD9CE]">
        {faqItems.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="py-3">
              <button
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between text-left text-xs font-mono font-medium text-[#1C231F] hover:text-[#234E36] transition-colors"
              >
                <span>{item.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#767E78] flex-shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#767E78] flex-shrink-0 ml-2" />
                )}
              </button>
              {isOpen && (
                <div className="mt-2 text-xs text-[#4E5851] leading-relaxed pl-2 border-l-2 border-[#234E36]">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
