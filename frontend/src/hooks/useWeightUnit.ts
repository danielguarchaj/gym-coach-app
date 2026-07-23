import { useState } from 'react'

type Unit = 'kg' | 'lb'
const KG_TO_LB = 2.20462

export function useWeightUnit() {
  const stored = (localStorage.getItem('weightUnit') as Unit) ?? 'kg'
  const [unit, setUnitState] = useState<Unit>(stored)

  function setUnit(u: Unit) {
    localStorage.setItem('weightUnit', u)
    setUnitState(u)
  }

  function toDisplay(kg: number): number {
    return unit === 'lb' ? Math.round(kg * KG_TO_LB * 4) / 4 : kg
  }

  function toStorage(value: number): number {
    return unit === 'lb' ? Math.round((value / KG_TO_LB) * 100) / 100 : value
  }

  return { unit, setUnit, toDisplay, toStorage }
}
