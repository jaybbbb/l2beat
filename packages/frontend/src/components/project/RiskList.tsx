import React from 'react'

import { ShieldIcon } from '../icons'

export interface RiskList {
  risks: TechnologyRisk[]
}

export interface TechnologyRisk {
  text: string
  isCritical: boolean
}

export function RiskList({ risks }: RiskList) {
  if (risks.length === 0) {
    return null
  }

  return (
    <ul className="bg-red-600 bg-opacity-20 rounded-lg p-4 mt-4 md:mt-6">
      {risks.map((risk, i) => (
        <li className="mt-2 first:mt-0 flex gap-3" key={i}>
          <ShieldIcon className="shrink-0 fill-red-700 dark:fill-red-300" />
          <p>
            {risk.isCritical ? (
              <>
                {risk.text.slice(0, -1)}{' '}
                <strong className="text-red-700 dark:text-red-300">
                  (CRITICAL)
                </strong>
                {risk.text.slice(-1)}
              </>
            ) : (
              risk.text
            )}
          </p>
        </li>
      ))}
    </ul>
  )
}
