import { useMeta } from './MetaContext.js'

// Plans come from the API (staff can add and edit them), so names are looked up, never typed.
// `plans` is every plan, lowest first, archived ones included so customers still on one show its name.
export function usePlans() {
  const { plans } = useMeta()
  return {
    plans,
    activePlans: plans.filter((plan) => plan.isActive),
    nameOf: (key) => plans.find((plan) => plan.key === key)?.name ?? key,
    rankOf: (key) => plans.findIndex((plan) => plan.key === key),
  }
}
